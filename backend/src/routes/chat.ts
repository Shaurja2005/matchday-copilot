/**
 * MatchDay Copilot — Chat API Route
 * POST /api/chat — Fan assistant
 * POST /api/chat/staff-reply — Staff quick-reply drafting
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
import { ChatRequest, ChatResponse, UserContext } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// -----------------------------------------------
// POST /api/chat — Fan assistant
// -----------------------------------------------

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
      // 1. Detect language
      const detectedLanguage = await detectLanguage(message);

      // 2. Retrieve RAG context from FAQ knowledge base
      const ragContext = vectorStore.retrieve(message, 3);

      // 3. Get live crowd data to inject into user message
      const snapshot = getCrowdSnapshot();
      const queueSummary = snapshot.queues
        .map((q) => `${q.gateName}: ${q.waitTimeMinutes}min (${q.trend})`)
        .join(', ');
      const zoneSummary = snapshot.zones
        .map((z) => `${z.name}: ${z.densityPercent}%`)
        .join(', ');

      // 4. Build prompts
      const systemPrompt = buildFanSystemPrompt(userContext as UserContext, ragContext);
      const userMessage = buildFanUserMessage(message, {
        queues: queueSummary,
        zones: zoneSummary,
      });

      // 5. Call GenAI
      const genAIResponse = await callGenAI({
        systemPrompt,
        messages: [
          ...conversationHistory,
          { role: 'user', content: userMessage },
        ],
        persona,
        useCache: ragContext.length > 0, // Cache FAQ-grounded responses
        maxTokens: 1024,
      });

      // 6. Safety check on output
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
