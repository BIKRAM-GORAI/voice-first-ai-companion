import axios from "axios";
import { LongTermMemory } from "../models/LongTermMemory.model.js";

export const classifyMemory = async (
  userText,
  assistantReply,
  sessionSummary,
  recentMessages,
  isCorrection = false
) => {
  try {
    const prompt = `
      You are a long-term memory classifier.

      Your job is to detect important personal facts that should be remembered.

      Return ONLY one of the following:

      1) Valid JSON
      2) The word: null

      Never return empty text.

      ----------------------------

      User message:
      "${userText}"

      Assistant reply:
      "${assistantReply}"

      Conversation summary:
      "${sessionSummary}"

      Recent conversation:
      ${recentMessages}

      ----------------------------

      Store memory if the user reveals:

      - their name
      - birthday
      - location
      - personal preference
      - a personal project
      - a long-term goal
      - a recurring behavior pattern
      - a meaningful insight
      - OR explicitly asks you to remember something

      ----------------------------

      If storing memory return JSON:

      {
      "category": "project | goal | habit | baseline | insight | emotional_pattern | struggle",
      "content": "Clear factual statement about Bikram",
      "tags": ["3-6 lowercase keywords"],
      "importanceScore": 1-5
      }
      If the user explicitly asks to store something in memory,
      you MUST generate a memory entry unless the information is meaningless.

      Baseline measurements should be stored.

      Examples:
      - Fitness numbers
      - Weight
      - Strength metrics
      - Skill level
      - Current capability

      These should use category: "baseline"

      Otherwise return:

      null
      `;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: process.env.GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "You classify memory for long-term storage.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 400,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const memoryResponse =
      response?.data?.choices?.[0]?.message?.content?.trim();

    console.log("MEMORY CLASSIFIER RAW RESPONSE:\n", memoryResponse);

    /* -------------------------------------------------- */
    /* 3️⃣ HANDLE EMPTY RESPONSE */
    /* -------------------------------------------------- */

    if (!memoryResponse || memoryResponse === "" || memoryResponse === "null") {
      return null;
    }

    /* -------------------------------------------------- */
    /* 4️⃣ SAFE JSON EXTRACTION */
    /* -------------------------------------------------- */

    let memory = null;

    try {
      const jsonMatch = memoryResponse.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        memory = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.log("Memory JSON parsing failed ❌");
      return null;
    }

    if (!memory) return null;

    /* -------------------------------------------------- */
    /* 5️⃣ FALLBACK IMPORTANCE */
    /* -------------------------------------------------- */

    if (!memory.importanceScore) {
      memory.importanceScore = 3;
    }

    /* -------------------------------------------------- */
    /* 6️⃣ STORE OR UPDATE MEMORY */
    /* -------------------------------------------------- */

    await LongTermMemory.findOneAndUpdate(
      { tags: { $in: memory.tags } },
      {
        $set: {
          category: memory.category,
          content: memory.content,
          tags: memory.tags,
          importanceScore: memory.importanceScore,
          updatedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    console.log("Memory stored/updated via classifier ✅");

    return memory;
  } catch (error) {
    console.error("Memory classifier error:", error.message);
    return null;
  }
};