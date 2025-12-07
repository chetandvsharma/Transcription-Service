import { Document } from 'mongoose';

export interface TranscriptionSchema extends Document {
  audioUrl: string;
  transcription: string;
  source: string;
  createdAt: Date;
}