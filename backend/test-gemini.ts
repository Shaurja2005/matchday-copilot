import { callGenAI } from './src/services/genai/geminiService';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const response = await callGenAI({
      systemPrompt: 'You are a helpful assistant.',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'assistant', content: 'Hello! How can I help?' },
        { role: 'user', content: 'What time is the game?' }
      ],
      persona: 'fan'
    });
    console.log('SUCCESS:', response.content);
  } catch (err) {
    console.error('ERROR CAUGHT:');
    console.error(err);
  }
}

test();
