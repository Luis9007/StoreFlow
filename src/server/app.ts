/**
 * @file app.ts (Server Backend Express)
 * @description Configuración principal de la aplicación Express.js (middlewares y enrutador).
 */

import express from 'express';
import cors from 'cors';
import apiRouter from './routes';

const app = express();

app.use(cors());
app.use(express.json());

// Registro global de la API REST bajo el prefijo /api
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
