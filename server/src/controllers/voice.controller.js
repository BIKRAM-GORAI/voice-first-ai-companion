import { transcribeAudio } from "../services/stt.service.js";
import { generateReply } from "../services/llm.service.js";
import { LongTermMemory } from "../models/LongTermMemory.model.js";
import { ConversationSession } from "../models/ConversationSession.model.js";
import { summarizeConversation } from "../services/summary.service.js";
import { classifyMemory } from "../services/memoryClassifier.service.js";
import { PersonalityMemory } from "../models/PersonalityMemory.model.js";
import { classifyPersonality } from "../services/personalityClassifier.service.js";
import { generateEmbedding } from "../services/embedding.service.js";
import {
  shouldRecallMemory,
  pickMemoryToRecall,
} from "../services/spontaneousRecall.service.js";

import { cosineSimilarity } from "../services/vectorSearch.service.js";

import {
  shouldTriggerCuriosity,
  pickCuriosityMemory,
} from "../services/curiosityRecall.service.js";

const extractKeywords = (text) => {
  const stopWords = [
    "the",
    "is",
    "a",
    "an",
    "and",
    "to",
    "of",
    "in",
    "on",
    "for",
    "after",
    "before",
    "i",
    "my",
    "you",
    "your",
  ];

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(" ")
    .filter((word) => word.length > 3 && !stopWords.includes(word));
};

export const handleVoiceRequest = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file received" });
    }

    const audioBuffer = req.file.buffer;

    // 1️⃣ Speech to text
    const transcript = await transcribeAudio(audioBuffer);
    console.log("Transcript:", transcript);

    // 2️⃣ Fetch or create session
    let session = await ConversationSession.findOne();

    if (!session) {
      session = await ConversationSession.create({
        summary: "",
        recent: [],
      });
    }

    // 3️⃣ Add user message
    session.recent.push({
      role: "user",
      content: transcript,
    });

    // const queryEmbedding = await generateEmbedding(transcript);

    // const memories = await LongTermMemory.find({
    //   embedding: { $exists: true, $ne: [] }
    // });

    // const scoredMemories = memories.map(memory => ({

    //   memory,

    //   score: cosineSimilarity(
    //     queryEmbedding,
    //     memory.embedding
    //   )

    // }));

    // const relevantMemories = scoredMemories
    //   .filter(m => m.score > 0.75)
    //   .sort((a, b) => b.score - a.score)
    //   .slice(0, 3)
    //   .map(m => m.memory);

    // const memoryTexts = relevantMemories.map(
    //   m => `- ${m.content}`
    // );

    const queryEmbedding = await generateEmbedding(transcript);

    let relevantMemories = [];
    let memoryTexts = [];

    if (queryEmbedding) {

      const memories = await LongTermMemory.find({
        embedding: { $exists: true, $ne: [] },
      });

      const scoredMemories = memories.map((memory) => ({
        memory,
        score: cosineSimilarity(queryEmbedding, memory.embedding),
      }));

      relevantMemories = scoredMemories
        .filter((m) => m.score > 0.5)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((m) => m.memory);

      memoryTexts = relevantMemories.map((m) => `Memory: ${m.content}`);
    }
    const personalityTraits = await PersonalityMemory.find()
      .sort({ weight: -1 })
      .limit(3);

    const personalitySection =
      personalityTraits.length > 0
        ? `User personality traits:\n${personalityTraits
            .map((t) => "- " + t.trait)
            .join("\n")}\n`
        : "";

    // 5️⃣ Build context block
    const summarySection = session.summary
      ? `Conversation summary:\n${session.summary}\n`
      : "";

    const recentSection =
      session.recent.length > 0
        ? `Recent messages:\n${session.recent
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n")}\n`
        : "";

    let recallSection = "";
    let curiositySection = "";

    if (shouldTriggerCuriosity()) {
      const curiosityMemory = pickCuriosityMemory(relevantMemories);
      if (curiosityMemory) {
        curiositySection = `
          Possible curiosity topic:
          ${curiosityMemory.content}
          `;
      }
    }
    if (shouldRecallMemory()) {
      const recalled = pickMemoryToRecall(relevantMemories);

      if (recalled) {
        recallSection = `
          Possible related memory:
          ${recalled.content}
          `;
      }
    }
    const memorySection = memoryTexts.length > 0
    ? `Relevant long-term memories:\n${memoryTexts.join("\n")}\n`
    : "";

    const contextualBlock = `
    ${personalitySection}
    ${recallSection}
    ${curiositySection}
    ${memorySection}
    ${summarySection}
    ${recentSection}
    `;
    // 6️⃣ Generate reply
    const reply = await generateReply(transcript, memoryTexts, contextualBlock);

    console.log("RAW LLM REPLY:\n", reply);

    // 7️⃣ Add assistant reply to session
    if (reply && reply.trim().length > 0) {
      session.recent.push({
        role: "assistant",
        content: reply,
      });
    }

    // 8️⃣ Rolling summary compression
    const MAX_RECENT = 6;

    if (session.recent.length > MAX_RECENT) {
      const chunkToSummarize = session.recent
        .slice(0, session.recent.length - 2)
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");

      const newSummary = await summarizeConversation(
        session.summary,
        chunkToSummarize,
      );

      session.summary = newSummary;
      session.recent = session.recent.slice(-2);

      console.log("Conversation summary updated ✅");
    }

    // Detect explicit correction patterns
    const correctionPatterns = [
      "actually",
      "i said it wrong",
      "i was wrong",
      "correction",
      "update",
    ];

    const isCorrection = correctionPatterns.some((p) =>
      transcript.toLowerCase().includes(p),
    );

    if (isCorrection) {
      console.log("Possible memory correction detected");
    }

    // 9️⃣ Separate memory classification
    const memory = await classifyMemory(
      transcript,
      reply,
      session.summary,
      isCorrection,
    );

    // await classifyMemory(
    //   transcript,
    //   reply,
    //   session.summary
    // );
    // personality detection

    if (memory) {
      const embedding = await generateEmbedding(memory.content);

      memory.embedding = embedding;

      await LongTermMemory.findOneAndUpdate(
        { tags: { $in: memory.tags } },
        { $set: memory },
        { upsert: true, returnDocument: "after" },
      );

      console.log("Memory stored with embedding ✅");
    }

    const trait = await classifyPersonality(transcript);
    if (trait) {
      await PersonalityMemory.findOneAndUpdate(
        { trait },
        { $inc: { weight: 1 } },
        { upsert: true, returnDocument: "after" },
      );
      console.log("Personality trait learned:", trait);
    }

    // 🔟 Save session
    await session.save();

    // 11️⃣ Send response
    res.json({
      transcript,
      reply,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};
