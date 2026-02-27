import { transcribeAudio } from "../services/stt.service.js";

export const handleVoiceRequest = async (req, res) => {
  try {
    console.log("Voice request received");

    if (!req.file) {
      return res.status(400).json({ error: "No audio file received" });
    }

    const audioBuffer = req.file.buffer;

    const transcript = await transcribeAudio(audioBuffer);

    console.log("Transcript:", transcript);

    res.json({
      transcript
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};