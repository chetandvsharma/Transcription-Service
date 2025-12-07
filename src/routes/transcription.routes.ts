import { Router } from "express";
import {transcriptionController} from "../controllers/transcription.js";
import multer from "multer";

const routes =Router();
const upload = multer();

routes.post("/transcription", upload.single("audio"), transcriptionController.createTranscription);
routes.get("/transcriptions", transcriptionController.fetchTranscriptions);
routes.post('/azure-transcription', transcriptionController.azureTranscribe);

export default routes;