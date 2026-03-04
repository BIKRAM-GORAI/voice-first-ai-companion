// import axios from "axios";
// import { LongTermMemory } from "../models/LongTermMemory.model.js";

// export const classifyMemory = async (
//   userText,
//   assistantReply,
//   sessionSummary,
//   isCorrection = false
// ) => {
//   try {

// const prompt = `
//     You are a strict long-term memory classifier for a personal AI system.

//     Analyze the following interaction:

//     User message:
//     "${userText}"

//     Assistant reply:
//     "${assistantReply}"

//     Existing conversation summary:
//     "${sessionSummary}"

//     --------------------------------

//     STORE MEMORY ONLY IF:

//     1) The user explicitly asks to remember something
//     2) A new long-term goal appears
//     3) A new ongoing project appears
//     4) A recurring behavioral pattern appears
//     5) A meaningful personal insight appears
//     6) The user CORRECTS or UPDATES previously stored information

//     --------------------------------

//     IMPORTANT RULE FOR CORRECTIONS:

//     If the user clearly corrects earlier information 
//     (example: birthday, location, preference, personal fact),

//     Treat it as an UPDATE of an existing memory.

//     The new memory should replace the old fact.

//     --------------------------------

//     DO NOT STORE IF:

//     - It is a micro improvement of an existing project
//     - It is already present in the summary
//     - It is a temporary conversation detail
//     - It is advice seeking

//     --------------------------------

//     If storing memory, return ONLY valid JSON:

//     Return ONLY ONE of the following:

//     1) A valid JSON object in this format:

//     {
//       "category": "project | goal | habit | insight | emotional_pattern | struggle",
//       "content": "Clear factual statement about Bikram.",
//       "tags": ["3-6 lowercase keywords"],
//       "importanceScore": 1-5
//     }

//     OR

//     2) The word:

//     null

//     You MUST always output either JSON or null.
//     Never return an empty response.
//     Never return explanations.
//     Never return markdown.
//     `;

//     const response = await axios.post(
//       "https://api.groq.com/openai/v1/chat/completions",
//       {
//         model: process.env.GROQ_MODEL,
//         messages: [
//           {
//             role: "system",
//             content: "You classify memory for long-term storage."
//           },
//           {
//             role: "user",
//             content: prompt
//           }
//         ],
//         temperature: 0.2,
//         max_tokens: 200
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     const memoryResponse =
//       response?.data?.choices?.[0]?.message?.content?.trim();
//       console.log("MEMORY CLASSIFIER RAW RESPONSE:\n", memoryResponse);

//     if (!memoryResponse || memoryResponse === "null") {
//       return null;
//     }

//     let memory = null;

//     try {
//       memory = JSON.parse(memoryResponse);
//     } catch (err) {
//       console.log("Memory JSON parsing failed");
//       return null;
//     }

//     if (!memory) return null;

//     // Update existing memory if tags overlap
//     await LongTermMemory.findOneAndUpdate(
//       { tags: { $in: memory.tags } },
//       {
//         $set: {
//           category: memory.category,
//           content: memory.content,
//           tags: memory.tags,
//           importanceScore: memory.importanceScore,
//           updatedAt: new Date()
//         }
//       },
//       { upsert: true, new: true }
//     );

//     console.log("Memory stored via classifier ✅");

//     return memory;

//   } catch (error) {
//     console.error("Memory classifier error:", error.message);
//     return null;
//   }
// };

import axios from "axios";
import { LongTermMemory } from "../models/LongTermMemory.model.js";

export const classifyMemory = async (
  userText,
  assistantReply,
  sessionSummary,
  isCorrection = false
) => {

  try {

    /* -------------------------------------------------- */
    /* 1️⃣ HANDLE EXPLICIT CORRECTIONS FIRST (RULE BASED) */
    /* -------------------------------------------------- */

    if (isCorrection) {

      const birthdayMatch = userText.match(
        /(\d{1,2})(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i
      );

      if (birthdayMatch) {

        const correctedMemory = {
          category: "insight",
          content: `Bikram's birthday is ${birthdayMatch[0]}`,
          tags: ["birthday"],
          importanceScore: 3
        };

        await LongTermMemory.findOneAndUpdate(
          { tags: { $in: ["birthday"] } },
          {
            $set: {
              category: correctedMemory.category,
              content: correctedMemory.content,
              tags: correctedMemory.tags,
              importanceScore: correctedMemory.importanceScore,
              updatedAt: new Date()
            }
          },
          { upsert: true, new: true }
        );

        console.log("Birthday memory corrected ✅");

        return correctedMemory;
      }
    }

    /* -------------------------------------------------- */
    /* 2️⃣ LLM MEMORY CLASSIFICATION */
    /* -------------------------------------------------- */

    const prompt = `
        You are a strict long-term memory classifier for a personal AI assistant.

        Your job is to determine whether the conversation contains information
        that should be stored or used to update existing memory.

        Analyze:

        User message:
        "${userText}"

        Assistant reply:
        "${assistantReply}"

        Conversation summary:
        "${sessionSummary}"

        ----------------------------

        STORE MEMORY IF:

        1) The user explicitly asks you to remember something
        2) The user shares a long-term personal fact
        3) The user describes an ongoing project
        4) The user reveals a long-term goal
        5) The user reveals a recurring behavior pattern
        6) The user CORRECTS previously stated information

        ----------------------------

        CORRECTION DETECTION RULE

        Treat statements like these as corrections:

        - "I said it wrong"
        - "Actually..."
        - "Correction"
        - "Update it"
        - "Replace the previous one"
        - "I meant..."
        - "That was incorrect"

        If the user corrects a previously known fact,
        return the corrected fact as the new memory.

        Example:

        User:
        "My birthday is September 12"

        Later:
        "Actually my birthday is September 20"

        Return:

        {
          "category": "insight",
          "content": "Bikram's birthday is September 20",
          "tags": ["birthday"],
          "importanceScore": 3
        }

        ----------------------------

        DO NOT STORE IF:

        - The message is temporary
        - The message is advice seeking
        - The information already exists in memory
        - The message is a small project detail

        ----------------------------

        OUTPUT FORMAT

        Return ONLY one of these:

        1) JSON:

        {
          "category": "project | goal | habit | insight | emotional_pattern | struggle",
          "content": "Clear factual statement about Bikram.",
          "tags": ["3-6 lowercase keywords"],
          "importanceScore": 1-5
        }

        OR

        2) null

        ----------------------------

        IMPORTANT RULES

        Always return JSON or null.
        Never return empty output.
        Never explain.
        Never add text.
        `;

       const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: process.env.GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "You classify memory for long-term storage."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 200
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
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
    /* 4️⃣ SAFE JSON PARSING */
    /* -------------------------------------------------- */

    let memory = null;

    try {
      memory = JSON.parse(memoryResponse);
    } catch (error) {
      console.log("Memory JSON parsing failed ❌");
      return null;
    }

    if (!memory) return null;

    /* -------------------------------------------------- */
    /* 5️⃣ STORE OR UPDATE MEMORY */
    /* -------------------------------------------------- */

    await LongTermMemory.findOneAndUpdate(
      { tags: { $in: memory.tags } },
      {
        $set: {
          category: memory.category,
          content: memory.content,
          tags: memory.tags,
          importanceScore: memory.importanceScore,
          updatedAt: new Date()
        }
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