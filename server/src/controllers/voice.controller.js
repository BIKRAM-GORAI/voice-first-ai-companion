import { transcribeAudio } from "../services/stt.service.js";
import { generateReply } from "../services/llm.service.js";
import { LongTermMemory } from "../models/LongTermMemory.model.js";

const extractMemory = (text) => {
  const memoryIndex = text.indexOf("MEMORY:");

  if (memoryIndex === -1) {
    return { cleanReply: text, memory: null };
  }

  const cleanReply = text.substring(0, memoryIndex).trim();

  const memoryText = text.substring(memoryIndex + 7).trim();

  try {
    const memoryJSON = JSON.parse(memoryText);
    return { cleanReply, memory: memoryJSON };
  } catch (error) {
    console.error("Memory parse failed");
    return { cleanReply: text, memory: null };
  }
};

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


    console.log("RAW LLM REPLY:\n", reply);

    
    // Extract memory if present
    const { cleanReply, memory } = extractMemory(reply);

    // Store memory if exists
    if (memory) {
      await LongTermMemory.create(memory);
      console.log("Memory stored ✅");
    }

    res.json({
      transcript,
      reply: cleanReply,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};
