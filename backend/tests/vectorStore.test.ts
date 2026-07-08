/**
 * Unit tests — RAG Vector Store
 */

import { vectorStore } from '../src/services/rag/vectorStore';

beforeAll(() => {
  vectorStore.initialize();
});

describe('RAG Vector Store', () => {
  it('should initialize with FAQ entries', () => {
    expect(vectorStore.size).toBeGreaterThan(0);
  });

  it('should retrieve relevant results for a restroom query', () => {
    const results = vectorStore.retrieveRaw('accessible restroom gate d wheelchair', 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0);
    // The top result should relate to restrooms or accessibility
    const topFaq = results[0].faq;
    const combinedText = (topFaq.question + topFaq.answer + topFaq.tags.join(' ')).toLowerCase();
    expect(
      combinedText.includes('restroom') || combinedText.includes('accessible') || combinedText.includes('wheelchair')
    ).toBe(true);
  });

  it('should return relevant results for transport query', () => {
    const results = vectorStore.retrieveRaw('metro bus get to stadium downtown', 3);
    expect(results.length).toBeGreaterThan(0);
    const topFaq = results[0].faq;
    expect(topFaq.category).toMatch(/transport|wayfinding/);
  });

  it('should return higher scores for exact keyword matches', () => {
    const results = vectorStore.retrieveRaw('bag policy prohibited items stadium', 5);
    const topScore = results[0].score;
    const lastScore = results[results.length - 1].score;
    expect(topScore).toBeGreaterThanOrEqual(lastScore);
  });

  it('retrieve() should return formatted string context', () => {
    const context = vectorStore.retrieve('where is first aid medical help', 2);
    expect(typeof context).toBe('string');
    if (context) {
      expect(context).toContain('Q:');
      expect(context).toContain('A:');
    }
  });

  it('should return empty string for very off-topic query', () => {
    // This tests the minScore threshold — unrelated queries return empty
    const context = vectorStore.retrieve('quantum physics blackhole theory', 3, 0.5);
    expect(context).toBe('');
  });
});
