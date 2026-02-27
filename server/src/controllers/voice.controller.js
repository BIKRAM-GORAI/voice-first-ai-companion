import { transcribeAudio } from "../services/stt.service.js";
import { generateReply } from "../services/llm.service.js";

export const handleVoiceRequest = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file received" });
    }

    const audioBuffer = req.file.buffer;

    // 1️⃣ STT
    const transcript = await transcribeAudio(audioBuffer);
    console.log("Transcript:", transcript);

    // 2️⃣ LLM
    const reply = await generateReply(transcript);
    console.log("Reply:", reply);

    res.json({
      transcript,
      reply
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};