import { Request, Response } from "express";
import { Transcription } from "../models/Transcription.js";
import { AudioService } from "../services/azureSpeech.js";

const audioService = new AudioService();

export default class TranscriptionController {
  async createTranscription(req: Request, res: Response) {
    try {
      const { audioUrl } = req.body;

      if (!audioUrl) {
        res
          .status(422)
          .json({
            success: false,
            info: "Unprocessable Entity",
            error: "audioUrl is required",
          });
        return;
      }

      // Download audio with retry logic
      const audioBuffer = await audioService.downloadAudio(audioUrl);

      // Transcribe audio
      const transcriptionText = await audioService.transcribeAudio(audioBuffer);

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
      res.status(500).json({ success: false, info : "Internal server error" ,error: error?.message || "Internal server error" });
    }
  }

async fetchTranscriptions(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;

    // Calculate date 30 days ago
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
        $project: {
          _id: 1,
          audioUrl: 1,
          transcription: 1,
          createdAt: 1,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Total count (without pagination)
    const totalCount = await Transcription.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.status(200).json({
      success: true,
      info: "OK",
      data: transcriptions,
      pagination: {page, limit, totalCount},
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
}
