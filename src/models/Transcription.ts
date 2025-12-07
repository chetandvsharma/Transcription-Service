import { Schema, model, Document } from 'mongoose';

export interface ITranscription extends Document {
  audioUrl: string;
  transcription: string;
  createdAt: Date;
}

const transcriptionSchema = new Schema<ITranscription>({
  audioUrl: { type: String, required: true },
  transcription: { type: String, required: true },
},{
  timestamps: true,
});

// Index for efficient querying of recent records
transcriptionSchema.index({ createdAt: -1 });

export const Transcription = model<ITranscription>('Transcription', transcriptionSchema);