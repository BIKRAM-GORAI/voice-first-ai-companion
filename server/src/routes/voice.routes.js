import express from "express";
import { handleVoiceRequest } from "../controllers/voice.controller.js";

const router = express.Router();

router.post("/voice", handleVoiceRequest);

export default router;