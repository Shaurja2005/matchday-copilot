/**
 * MatchDay Copilot — Lightweight RAG Vector Store
 *
 * Implements in-memory cosine similarity search over FAQ embeddings.
 * Uses TF-IDF style term frequency as a lightweight embedding approximation
 * (no external embedding service required — works offline).
 *
 * For production, replace with a proper embedding model + ChromaDB/Pinecone.
 */

import { FAQEntry } from '../../types';
import faqData from '../../data/faq-knowledge-base.json';
import { logger } from '../../utils/logger';

// -------------------------
// Type definitions
// -------------------------

interface VectorEntry {
  id: string;
  text: string; // Searchable text (question + tags + category)
  answer: string;
  termFrequencies: Map<string, number>;
  faq: FAQEntry;
}

// -------------------------
// Text processing utilities
// -------------------------

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'it', 'in', 'on', 'at', 'to', 'for', 'of', 'and',
  'or', 'but', 'not', 'with', 'from', 'this', 'that', 'are', 'was', 'be',
  'do', 'i', 'me', 'my', 'you', 'your', 'we', 'our', 'they', 'their', 'have',
  'has', 'had', 'can', 'could', 'will', 'would', 'should', 'what', 'where',
  'when', 'how', 'who', 'which', 'there', 'here',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function computeTermFrequencies(text: string): Map<string, number> {
  const tokens = tokenize(text);
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  return tf;
}

function cosineSimilarity(
  vecA: Map<string, number>,
  vecB: Map<string, number>
): number {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (const [term, countA] of vecA) {
    dotProduct += countA * (vecB.get(term) || 0);
    magnitudeA += countA * countA;
  }
  for (const [, countB] of vecB) {
    magnitudeB += countB * countB;
  }

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

// -------------------------
// Vector store
// -------------------------

class FAQVectorStore {
  private entries: VectorEntry[] = [];
  private initialized = false;

  /**
   * Build the in-memory vector store from the FAQ knowledge base.
   * Called once at startup.
   */
  initialize(): void {
    if (this.initialized) return;

    const faqs = faqData as FAQEntry[];

    this.entries = faqs.map((faq) => {
      const searchableText = [
        faq.question,
        faq.answer,
        faq.category,
        faq.tags.join(' '),
      ].join(' ');

      return {
        id: faq.id,
        text: searchableText,
        answer: faq.answer,
        termFrequencies: computeTermFrequencies(searchableText),
        faq,
      };
    });

    this.initialized = true;
    logger.info(`RAG: Vector store initialized with ${this.entries.length} FAQ entries`);
  }

  /**
   * Retrieve the top-k most relevant FAQ entries for a given query.
   * Returns formatted context string for prompt injection.
   */
  retrieve(query: string, topK = 3, minScore = 0.1): string {
    if (!this.initialized) this.initialize();
    if (this.entries.length === 0) return '';

    const queryVec = computeTermFrequencies(query);

    const scored = this.entries
      .map((entry) => ({
        entry,
        score: cosineSimilarity(queryVec, entry.termFrequencies),
      }))
      .filter((item) => item.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    if (scored.length === 0) {
      logger.info('RAG: No relevant FAQ entries found for query');
      return '';
    }

    logger.info(`RAG: Retrieved ${scored.length} relevant entries (top score: ${scored[0].score.toFixed(3)})`);

    return scored
      .map(
        ({ entry }) =>
          `Q: ${entry.faq.question}\nA: ${entry.faq.answer}`
      )
      .join('\n\n---\n\n');
  }

  /**
   * Get the raw top FAQ entries (for testing/debugging).
   */
  retrieveRaw(
    query: string,
    topK = 3
  ): Array<{ faq: FAQEntry; score: number }> {
    if (!this.initialized) this.initialize();

    const queryVec = computeTermFrequencies(query);
    return this.entries
      .map((entry) => ({
        faq: entry.faq,
        score: cosineSimilarity(queryVec, entry.termFrequencies),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  get size(): number {
    return this.entries.length;
  }
}

// Singleton instance
export const vectorStore = new FAQVectorStore();

// Initialize at module load
vectorStore.initialize();
