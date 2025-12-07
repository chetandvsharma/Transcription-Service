import { Router } from "express";
import TranscriptionController from "../controllers/transcription.js";
import multer from "multer";

const routes =Router();
const transcriptionController = new TranscriptionController();
const upload = multer();

routes.post("/transcription", upload.single("audio"), transcriptionController.createTranscription);
routes.get("/transcriptions", transcriptionController.fetchTranscriptions);

export default routes;