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

import { EpisodicMemory } from "../models/EpisodicMemory.model.js";
import { classifyEpisodicEvent } from "../services/episodicClassifier.service.js";

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

    const queryEmbedding = await generateEmbedding(transcript);

    let relevantMemories = [];
    let memoryTexts = [];

    if (queryEmbedding) {
      const memories = await LongTermMemory.find({
        embedding: { $exists: true, $ne: [] },
      });

      const now = Date.now();
      const scoredMemories = memories.map((memory) => {
        const similarity = cosineSimilarity(queryEmbedding, memory.embedding);

        const importance = memory.importanceScore || 1;
        const lastUsed = memory.updatedAt
          ? new Date(memory.updatedAt).getTime()
          : now;

        const recency = 1 / (1 + (now - lastUsed) / (1000 * 60 * 60 * 24));

        const finalScore =
          0.6 * similarity + 0.25 * (importance / 5) + 0.15 * recency;

        return {
          memory,
          score: finalScore,
        };
      });

      relevantMemories = scoredMemories
        .filter((m) => m.score > 0.25)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((m) => m.memory);

      //added on my own
      await LongTermMemory.updateMany(
        { _id: { $in: relevantMemories.map((m) => m._id) } },
        { $set: { lastReferenced: new Date() } },
      );
      //
      console.log("🔎 Memory candidates:");
      scoredMemories
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .forEach((m) => console.log(m.score.toFixed(2), "→", m.memory.content));

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
            .slice(-6)
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
    const memorySection =
      memoryTexts.length > 0
        ? `Relevant long-term memories:\n${memoryTexts.join("\n")}\n`
        : "";

    // const contextualBlock = `
    // ${personalitySection}
    // ${recallSection}
    // ${curiositySection}
    // ${memorySection}
    // ${summarySection}
    // ${recentSection}
    // `;
    const recentEvents = await EpisodicMemory
      .find()
      .sort({ createdAt: -1 })
      .limit(3);

    const episodicSection =
      recentEvents.length > 0
        ? `Recent events:\n${recentEvents
            .map(e => "- " + e.event)
            .join("\n")}\n`
        : "";
        
    const safe = (text) => (text ? text : "");
    const contextualBlock = `
    ${safe(personalitySection)}
    ${safe(episodicSection)}
    ${safe(recallSection)}
    ${safe(curiositySection)}
    ${safe(memorySection)}
    ${safe(summarySection)}
    ${safe(recentSection)}
    `;

    // 6️⃣ Generate reply
    const reply = await generateReply(transcript, memoryTexts, contextualBlock);

    /* ----------------------------- */
    /* Episodic memory detection     */
    /* ----------------------------- */

    const episodicEvent = await classifyEpisodicEvent(transcript, reply);

    if (episodicEvent) {
      const embedding = await generateEmbedding(episodicEvent);

      await EpisodicMemory.create({
        event: episodicEvent,
        embedding,
      });

      console.log("Episodic memory stored:", episodicEvent);
    }

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
