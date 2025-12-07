import { Request, Response } from "express";
import { Transcription } from "../models/Transcription.js";
import { azureSpeechService } from "../services/azureSpeech.js";

export default class TranscriptionController {
  async createTranscription(req: Request, res: Response) {
    try {
      const { audioUrl } = req.body;

      if (!audioUrl) {
        res.status(422).json({
          success: false,
          info: "Unprocessable Entity",
          error: "audioUrl is required",
        });
        return;
      }

      // Download audio with retry logic
      const audioBuffer = await azureSpeechService.downloadAudio(audioUrl);

      // Transcribe audio
      const transcriptionText = await azureSpeechService.transcribeAudio(
        audioBuffer
      );

      // Save to MongoDB
      const transcription = new Transcription({
        audioUrl,
        transcription: transcriptionText,
      });

      await transcription.save();

      res.status(201).json({
        success: true,
        info: "Created",
        message: "transcribed text",
        data: {
          _id: transcription._id,
          audioUrl: transcription.audioUrl,
          transcription: transcription.transcription,
          createdAt: transcription.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Transcription error:", error);
      res.status(500).json({
        success: false,
        info: "Internal server error",
        error: error?.message || "Internal server error",
      });
    }
  }

  async fetchTranscriptions(req: Request, res: Response) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const transcriptions = await Transcription.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $project: { __v: 0 },
        },
      ]);

      res.status(200).json({
        success: true,
        info: "OK",
        data: transcriptions,
        totalRecords: transcriptions?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching transcriptions:", error);
      res.status(500).json({
        success: false,
        info: "Internal server error",
        error: "Failed to fetch transcriptions",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async azureTranscribe(req: Request, res: Response) {
    const { audioUrl, locale } = req?.body;

    if (!audioUrl || typeof audioUrl !== "string") {
      return res.status(422).json({
        success: false,
        info: "Unprocessable Entity",
        error: "audioUrl is required",
      });
    }

    try {
      const result = await azureSpeechService.transcribe(
        audioUrl,
        locale || "en-US"
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          info: "Internal Server Error",
          error: "Azure transcription failed",
          details: result.error,
        });
      }

      const saved = await Transcription.create({
        audioUrl,
        transcription: result.transcription,
        source: "azure",
        createdAt: new Date(),
      });

      res.status(201).json({
        success: true,
        info: "Created",
        id: saved._id,
        message: "Azure transcription completed (mocked)",
        preview: result.transcription?.slice(0, 100) + "...",
      });
    } catch (err: any) {
      console.error("Azure endpoint error:", err);
      res
        .status(500)
        .json({
          success: false,
          info: "Internal Server Error",
          error: err.message || "Internal server error",
        });
    }
  }
}

export const transcriptionController = new TranscriptionController();
