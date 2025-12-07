import { Schema, model } from 'mongoose';
import { TranscriptionSchema } from '../types/models.js';

const transcriptionSchema = new Schema<TranscriptionSchema>({
  audioUrl: { type: String, required: true },
  transcription: { type: String, required: true },
  source: { type: String, default: "createTranscription api" },
},{
  timestamps: true,
});

// Index for efficient querying of recent records
transcriptionSchema.index({ createdAt: -1, _id: -1 });

export const Transcription = model<TranscriptionSchema>('Transcription', transcriptionSchema);