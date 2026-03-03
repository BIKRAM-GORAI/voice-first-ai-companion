


// import { transcribeAudio } from "../services/stt.service.js";
// import { generateReply } from "../services/llm.service.js";
// import { LongTermMemory } from "../models/LongTermMemory.model.js";
// import { summarizeConversation } from "../services/summary.service.js";
// import { ConversationSession } from "../models/ConversationSession.model.js";



// // ---------------- MEMORY EXTRACTION ----------------

// const extractMemory = (text) => {
//   const memoryIndex = text.indexOf("MEMORY:");

//   if (memoryIndex === -1) {
//     return { cleanReply: text, memory: null };
//   }

//   const cleanReply = text.substring(0, memoryIndex).trim();
//   const memoryText = text.substring(memoryIndex + 7).trim();

//   try {
//     const memoryJSON = JSON.parse(memoryText);
//     return { cleanReply, memory: memoryJSON };
//   } catch (error) {
//     console.error("Memory parse failed");
//     return { cleanReply: text, memory: null };
//   }
// };

// // ---------------- KEYWORD EXTRACTION ----------------

// const extractKeywords = (text) => {
//   const stopWords = [
//     "the", "is", "a", "an", "and", "to", "of",
//     "in", "on", "for", "after", "before", "i", "my"
//   ];

//   return text
//     .toLowerCase()
//     .replace(/[^\w\s]/g, "")
//     .split(" ")
//     .filter(word => word.length > 3 && !stopWords.includes(word));
// };

// // ---------------- MAIN HANDLER ----------------

// export const handleVoiceRequest = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No audio file received" });
//     }

//     const audioBuffer = req.file.buffer;

//     // 1️⃣ STT
//     const transcript = await transcribeAudio(audioBuffer);
//     console.log("Transcript:", transcript);

//     // Fetch single session (create if doesn't exist)
//     let session = await ConversationSession.findOne();

//     if (!session) {
//       session = await ConversationSession.create({
//         summary: "",
//         recent: []
//       });
//     }

//     // Add user message to short-term recent context
//     session.recent.push({ role: "user", content: transcript });

//     // ---------------- LONG TERM MEMORY MATCH ----------------

//     const keywords = extractKeywords(transcript);

//     const relevantMemories = await LongTermMemory.find({
//       tags: { $in: keywords }
//     })
//       .sort({ importanceScore: -1 })
//       .limit(2);

//     const memoryTexts = relevantMemories.map(m => `- ${m.content}`);

//     // ---------------- SHORT TERM CONTEXT BUILD ----------------

//     const summarySection = session.summary
//       ? `Conversation summary:\n${session.summary}\n`
//       : "";

//     const recentSection = session.recent.length > 0
//       ? `Recent messages:\n${session.recent
//           .map(m => `${m.role.toUpperCase()}: ${m.content}`)
//           .join("\n")}\n`
//       : "";

//     const contextualBlock = `
// ${summarySection}
// ${recentSection}
// `;

//     // 2️⃣ LLM
//     const reply = await generateReply(transcript, memoryTexts, contextualBlock);

//     console.log("RAW LLM REPLY:\n", reply);

//     // Add assistant reply to recent context
//     session.recent.push({ role: "assistant", content: reply });

//     // ---------------- MEMORY EXTRACTION ----------------

//     const { cleanReply, memory } = extractMemory(reply);

//     if (memory) {
//       await LongTermMemory.create(memory);
//       console.log("Memory stored ✅");
//     }

//     // ---------------- ROLLING SUMMARY LOGIC ----------------

//     const MAX_RECENT = 6; // 3 exchanges

//     if (session.recent.length > MAX_RECENT) {

//       const chunkToSummarize = session.recent
//         .slice(0, session.recent.length - 2) // keep last 2 raw messages
//         .map(m => `${m.role.toUpperCase()}: ${m.content}`)
//         .join("\n");

//       const newSummary = await summarizeConversation(
//         session.summary,
//         chunkToSummarize
//       );

//       session.summary = newSummary;

//       // Keep only last 2 messages raw
//       session.recent = session.recent.slice(-2);

//       console.log("Conversation summary updated ✅");
//     }

//     // ---------------- RESPONSE ----------------

//     res.json({
//       transcript,
//       reply: cleanReply
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// };






// import { transcribeAudio } from "../services/stt.service.js";
// import { generateReply } from "../services/llm.service.js";
// import { LongTermMemory } from "../models/LongTermMemory.model.js";
// import { ConversationSession } from "../models/ConversationSession.model.js";
// import { summarizeConversation } from "../services/summary.service.js";

// // ---------------- MEMORY EXTRACTION ----------------

// const extractMemory = (text) => {
//   const memoryIndex = text.indexOf("MEMORY:");

//   if (memoryIndex === -1) {
//     return { cleanReply: text, memory: null };
//   }

//   const cleanReply = text.substring(0, memoryIndex).trim();
//   const memoryText = text.substring(memoryIndex + 7).trim();

//   try {
//     const memoryJSON = JSON.parse(memoryText);
//     return { cleanReply, memory: memoryJSON };
//   } catch (error) {
//     console.error("Memory parse failed");
//     return { cleanReply: text, memory: null };
//   }
// };

// // ---------------- KEYWORD EXTRACTION ----------------

// const extractKeywords = (text) => {
//   const stopWords = [
//     "the", "is", "a", "an", "and", "to", "of",
//     "in", "on", "for", "after", "before",
//     "i", "my", "you", "your"
//   ];

//   return text
//     .toLowerCase()
//     .replace(/[^\w\s]/g, "")
//     .split(" ")
//     .filter(word => word.length > 3 && !stopWords.includes(word));
// };

// // ---------------- MAIN HANDLER ----------------

// export const handleVoiceRequest = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No audio file received" });
//     }

//     const audioBuffer = req.file.buffer;

//     // 1️⃣ Speech to Text
//     const transcript = await transcribeAudio(audioBuffer);
//     console.log("Transcript:", transcript);

//     // 2️⃣ Fetch or Create Persistent Session
//     let session = await ConversationSession.findOne();

//     if (!session) {
//       session = await ConversationSession.create({
//         summary: "",
//         recent: []
//       });
//     }

//     // 3️⃣ Add user message to session
//     session.recent.push({
//       role: "user",
//       content: transcript
//     });

//     // 4️⃣ Long-Term Memory Retrieval (tag based)
//     const keywords = extractKeywords(transcript);

//     const relevantMemories = await LongTermMemory.find({
//       tags: { $in: keywords }
//     })
//       .sort({ importanceScore: -1 })
//       .limit(2);

//     const memoryTexts = relevantMemories.map(
//       m => `- ${m.content}`
//     );

//     // 5️⃣ Build Context Block (Summary + Recent)

//     const summarySection = session.summary
//       ? `Conversation summary:\n${session.summary}\n`
//       : "";

//     const recentSection = session.recent.length > 0
//       ? `Recent messages:\n${session.recent
//           .map(m => `${m.role.toUpperCase()}: ${m.content}`)
//           .join("\n")}\n`
//       : "";

//     const contextualBlock = `
// ${summarySection}
// ${recentSection}
// `;

//     // 6️⃣ Generate LLM Reply
//     const reply = await generateReply(
//       transcript,
//       memoryTexts,
//       contextualBlock
//     );

//     console.log("RAW LLM REPLY:\n", reply);

//     // 7️⃣ Extract structured long-term memory if present
//     const { cleanReply, memory } = extractMemory(reply);

//     if (memory) {
//       await LongTermMemory.create(memory);
//       console.log("Memory stored ✅");
//     }

//     // 8️⃣ Add assistant reply to session
//     session.recent.push({
//       role: "assistant",
//       content: cleanReply
//     });

//     // 9️⃣ Rolling Summary Compression
//     const MAX_RECENT = 6; // 3 exchanges

//     if (session.recent.length > MAX_RECENT) {

//       const chunkToSummarize = session.recent
//         .slice(0, session.recent.length - 2)
//         .map(m => `${m.role.toUpperCase()}: ${m.content}`)
//         .join("\n");

//       const newSummary = await summarizeConversation(
//         session.summary,
//         chunkToSummarize
//       );

//       session.summary = newSummary;

//       // Keep only last 2 messages
//       session.recent = session.recent.slice(-2);

//       console.log("Conversation summary updated ✅");
//     }

//     // 🔟 Save session state
//     await session.save();

//     // 11️⃣ Send response
//     res.json({
//       transcript,
//       reply: cleanReply
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// };




import { transcribeAudio } from "../services/stt.service.js";
import { generateReply } from "../services/llm.service.js";
import { LongTermMemory } from "../models/LongTermMemory.model.js";
import { ConversationSession } from "../models/ConversationSession.model.js";
import { summarizeConversation } from "../services/summary.service.js";
import { classifyMemory } from "../services/memoryClassifier.service.js";

const extractKeywords = (text) => {
  const stopWords = [
    "the","is","a","an","and","to","of",
    "in","on","for","after","before",
    "i","my","you","your"
  ];

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(" ")
    .filter(word => word.length > 3 && !stopWords.includes(word));
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
        recent: []
      });
    }

    // 3️⃣ Add user message
    session.recent.push({
      role: "user",
      content: transcript
    });

    // 4️⃣ Retrieve relevant long-term memories
    const keywords = extractKeywords(transcript);

    const relevantMemories = await LongTermMemory.find({
      tags: { $in: keywords }
    })
      .sort({ importanceScore: -1 })
      .limit(2);

    const memoryTexts = relevantMemories.map(
      m => `- ${m.content}`
    );

    // 5️⃣ Build context block
    const summarySection = session.summary
      ? `Conversation summary:\n${session.summary}\n`
      : "";

    const recentSection = session.recent.length > 0
      ? `Recent messages:\n${session.recent
          .map(m => `${m.role.toUpperCase()}: ${m.content}`)
          .join("\n")}\n`
      : "";

    const contextualBlock = `
${summarySection}
${recentSection}
`;

    // 6️⃣ Generate reply
    const reply = await generateReply(
      transcript,
      memoryTexts,
      contextualBlock
    );

    console.log("RAW LLM REPLY:\n", reply);

    // 7️⃣ Add assistant reply to session
    session.recent.push({
      role: "assistant",
      content: reply
    });

    // 8️⃣ Rolling summary compression
    const MAX_RECENT = 6;

    if (session.recent.length > MAX_RECENT) {

      const chunkToSummarize = session.recent
        .slice(0, session.recent.length - 2)
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");

      const newSummary = await summarizeConversation(
        session.summary,
        chunkToSummarize
      );

      session.summary = newSummary;
      session.recent = session.recent.slice(-2);

      console.log("Conversation summary updated ✅");
    }

    // 9️⃣ Separate memory classification
    const memory = await classifyMemory(
      transcript,
      reply,
      session.summary
    );

    if (memory) {
      await LongTermMemory.create(memory);
      console.log("Memory stored via classifier ✅");
    }

    // 🔟 Save session
    await session.save();

    // 11️⃣ Send response
    res.json({
      transcript,
      reply
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};