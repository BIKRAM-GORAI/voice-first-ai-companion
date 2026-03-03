import axios from "axios";

export const classifyMemory = async (userText, assistantReply, sessionSummary) => {
  try {

    const prompt = `
    You are a strict long-term memory classifier for a personal AI system.

    Your job is to store only HIGH-SIGNAL information.

    Analyze:

    User message:
    "${userText}"

    Assistant reply:
    "${assistantReply}"

    Existing conversation summary:
    "${sessionSummary}"

    ----------------------------
    STORE MEMORY ONLY IF:
    ----------------------------

    1) The user explicitly asks to remember something for later.
    OR
    2) A NEW long-term goal is introduced.
    OR
    3) A NEW ongoing project is introduced.
    OR
    4) A clear recurring behavioral pattern is revealed.
    OR
    5) A meaningful identity-level insight is expressed.

    ----------------------------
    DO NOT STORE IF:
    ----------------------------

    - The message is a micro-adjustment or refinement of an already known project.
    - The topic is already clearly present in the summary.
    - It is a small improvement question.
    - It is a one-time tactical question.
    - It does not change scope, direction, or identity.
    - It is advice-seeking without new personal information.

    Only store if it adds NEW structural information not already reflected in the summary.

    ----------------------------

    If storing:
    Return ONLY valid JSON in this exact format:

    {
    "category": "project | goal | habit | insight | emotional_pattern | struggle",
    "content": "Clear factual statement about Bikram.",
    "tags": ["3-6 lowercase keywords"],
    "importanceScore": 1-5
    }

    Importance scoring guide:
    1-2 = minor but useful long-term fact
    3 = moderate significance
    4-5 = strong recurring or identity-level pattern

    If not storing:
    Return exactly:
    null

    Do not explain.
    Do not add text.
    Return JSON or null only.
    `;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/responses",
      {
        model: process.env.GROQ_MODEL,
        input: prompt,
        temperature: 0
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const messageOutput = response.data.output.find(
      item => item.type === "message"
    );

    const textContent = messageOutput.content.find(
      item => item.type === "output_text"
    );

    const rawText = textContent.text.trim();

    if (rawText === "null") return null;

    return JSON.parse(rawText);

  } catch (error) {
    console.error("Memory classification error:", error.message);
    return null;
  }
};