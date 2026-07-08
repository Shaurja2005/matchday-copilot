/**
 * MatchDay Copilot — Express Application Entry Point
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import chatRouter from './routes/chat';
import crowdRouter from './routes/crowd';
import staffRouter from './routes/staff';
import organizerRouter from './routes/organizer';
import { startSimulation } from './services/crowd/crowdSimulator';
import { vectorStore } from './services/rag/vectorStore';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// -----------------------------------------------
// Security middleware
// -----------------------------------------------

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10kb' })); // Limit request body size

// -----------------------------------------------
// Routes
// -----------------------------------------------

app.use('/api/chat', chatRouter);
app.use('/api/crowd', crowdRouter);
app.use('/api/staff', staffRouter);
app.use('/api/organizer', organizerRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    genaiMode: process.env.GENAI_MODE || 'live',
    ragEntries: vectorStore.size,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

// -----------------------------------------------
// Startup
// -----------------------------------------------

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`MatchDay Copilot backend running on http://localhost:${PORT}`);
    logger.info(`GenAI mode: ${process.env.GENAI_MODE || 'live'}`);

    // Initialize RAG vector store
    vectorStore.initialize();
    logger.info(`RAG: ${vectorStore.size} FAQ entries indexed`);

    // Start crowd simulation
    startSimulation();
    logger.info('Crowd simulation started');
  });
}

export default app;
