import express from "express";
import { handleVoiceRequest } from "../controllers/voice.controller.js";
import upload from "../utils/upload.js";

const router = express.Router();

router.post("/voice", upload.single("audio"), handleVoiceRequest);

export default router;