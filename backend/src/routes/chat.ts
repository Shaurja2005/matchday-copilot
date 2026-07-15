/**
 * MatchDay Copilot — Chat API Route
 *
 * Endpoints:
 *   POST /api/chat              — Fan-facing multilingual assistant
 *   POST /api/chat/staff-reply  — Staff quick-reply drafting (English note → fan's language)
 *
 * Design note: This route orchestrates the full GenAI pipeline but contains NO
 * business logic itself. Prompt construction lives in `prompts/`, crowd formatting
 * in `utils/crowdFormatter`, and safety checks in `services/genai/safetyCheck`.
 * The route handler's only job is to wire these services together and handle HTTP.
 */

import { Router, Request, Response } from 'express';
import { validateChatRequest, validateStaffReplyRequest, sanitizeChatMessage } from '../middleware/inputValidator';
import { chatRateLimiter } from '../middleware/rateLimiter';
import { callGenAI, detectLanguage } from '../services/genai/geminiService';
import { checkContentSafety } from '../services/genai/safetyCheck';
import { vectorStore } from '../services/rag/vectorStore';
import { buildFanSystemPrompt, buildFanUserMessage } from '../prompts/fanAssistant';
import { buildQuickReplyPrompt } from '../prompts/staffBriefing';
import { getCrowdSnapshot } from '../services/crowd/crowdSimulator';
import { formatQueueSummary, formatZoneSummary } from '../utils/crowdFormatter';
import { ChatRequest, ChatResponse } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// -----------------------------------------------
// POST /api/chat — Fan assistant
// -----------------------------------------------

/**
 * Handle a fan chat message through the full GenAI pipeline:
 *   1. Detect language of the incoming message
 *   2. Retrieve relevant FAQ context from the RAG vector store
 *   3. Inject live crowd data (queues + zone density) into the user message
 *   4. Build system + user prompts
 *   5. Call Gemini GenAI
 *   6. Safety-check the output before returning it to the fan
 *
 * Cache is enabled for FAQ-grounded responses to reduce repeat API costs.
 */
router.post(
  '/',
  chatRateLimiter,
  validateChatRequest,
  sanitizeChatMessage,
  async (req: Request, res: Response): Promise<void> => {
    const {
      message,
      conversationHistory = [],
      persona = 'fan',
      userContext,
    } = req.body as ChatRequest;

    try {
      // 1. Detect language — used by the system prompt to instruct the AI to
      //    respond in the same language as the fan's message.
      const detectedLanguage = await detectLanguage(message);

      // 2. Retrieve RAG context from FAQ knowledge base
      const ragContext = vectorStore.retrieve(message, 3);

      // 3. Get live crowd data and format for prompt injection
      const snapshot = getCrowdSnapshot();
      const queueSummary = formatQueueSummary(snapshot.queues);
      const zoneSummary = formatZoneSummary(snapshot.zones);

      // 4. Build prompts
      const systemPrompt = buildFanSystemPrompt(userContext, ragContext);
      const userMessage = buildFanUserMessage(message, {
        queues: queueSummary,
        zones: zoneSummary,
      });

      // 5. Call GenAI — cache enabled when FAQ context was retrieved, since
      //    FAQ-grounded answers are deterministic and safe to cache.
      const genAIResponse = await callGenAI({
        systemPrompt,
        messages: [
          ...conversationHistory,
          { role: 'user', content: userMessage },
        ],
        persona,
        useCache: ragContext.length > 0,
        maxTokens: 1024,
      });

      // 6. Safety check on output — defense-in-depth measure on top of prompt safety
      const safetyResult = checkContentSafety(genAIResponse.content);

      if (!safetyResult.isSafe) {
        logger.warn(`Safety check failed: ${safetyResult.flaggedReason}`);
        res.status(200).json({
          reply: "I'm sorry, I wasn't able to generate a safe response. Please try rephrasing your question or ask a stadium steward for help.",
          detectedLanguage,
          safetyFlagged: true,
          cached: false,
        } satisfies ChatResponse);
        return;
      }

      const reply = safetyResult.sanitizedContent || genAIResponse.content;

      res.json({
        reply,
        detectedLanguage,
        cached: genAIResponse.cached,
        safetyFlagged: false,
      } satisfies ChatResponse);
    } catch (error) {
      logger.error('Chat endpoint error', error);
      res.status(500).json({
        error: 'Failed to generate response. Please try again.',
      });
    }
  }
);

// -----------------------------------------------
// POST /api/chat/staff-reply — Staff quick-reply
// -----------------------------------------------

/**
 * Draft a fan-facing reply from a staff member's internal note.
 * Staff type their note in English; this endpoint translates and polishes it
 * into a warm, appropriate message in the fan's language.
 *
 * Use case: A Spanish-speaking fan asks a question. The English-speaking staff
 * member types "Tell them Gate C is open and wait time is 5 min." The AI
 * generates a friendly Spanish reply.
 */
router.post(
  '/staff-reply',
  chatRateLimiter,
  validateStaffReplyRequest,
  async (req: Request, res: Response): Promise<void> => {
    const { staffNote, targetLanguage, fanOriginalMessage } = req.body as {
      staffNote: string;
      targetLanguage: string;
      fanOriginalMessage: string;
    };

    try {
      const systemPrompt = buildQuickReplyPrompt(
        staffNote,
        targetLanguage,
        fanOriginalMessage
      );

      const response = await callGenAI({
        systemPrompt,
        messages: [{ role: 'user', content: 'Generate the fan reply now.' }],
        persona: 'staff',
        useCache: false,
        maxTokens: 300,
      });

      const safetyResult = checkContentSafety(response.content);
      if (!safetyResult.isSafe) {
        res.status(422).json({ error: 'Generated reply failed safety check. Please revise your note.' });
        return;
      }

      res.json({ reply: safetyResult.sanitizedContent || response.content });
    } catch (error) {
      logger.error('Staff reply endpoint error', error);
      res.status(500).json({ error: 'Failed to generate reply.' });
    }
  }
);

export default router;
