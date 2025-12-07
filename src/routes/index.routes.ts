import { Express, Request, Response } from 'express';
import transcriptionRoutes from './transcription.routes.js';

const initializeRoutes = (app: Express) => {
  app.use('/api', transcriptionRoutes);

  app.get('/health', (_req: Request, res: Response) => {
  console.log("Health check endpoint called.");
  res.status(200).json({ success: true, info: 'OK', message: 'Server is running' });
});
};

export default initializeRoutes;