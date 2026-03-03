import axios from "axios";
import { systemPrompt } from "../config/systemPrompt.js";


export const generateReply = async (userText, memories = []) => {
  try {

    const memorySection = memories.length > 0
      ? `\nRelevant context:\n${memories.join("\n")}\n`
      : "";

      const fullPrompt = `
      You are Anya.

      You are calm, grounded, and steady.
      You speak directly to Bikram.

      Respond in a single natural paragraph.
      Maximum 4 sentences.
      No bullet points.
      No numbered lists.
      No clichés.
      No motivational reassurance.
      No soft coaching language such as "it might help" or "take a step back".
      No long explanations.
      Avoid phrases like "your own journey" or abstract self-help language.
      Be concrete and specific.
      Do not use his name unless grounding is necessary. Most responses should not include his name.

      Occasionally, if relevant to growth or consistency,
      you may briefly reference a grounded real-world pattern or observation in 1 sentence.
      Do not name celebrities unless specifically asked.
      Keep it subtle.

      Structure strictly:
      - One short emotional acknowledgment.
      - One grounded reframing statement.
      - At most ONE direct, sharp question.

      Be concise. Be clear. Be slightly sharp when needed.

      ${memorySection}

      User says:
      "${userText}"

      Respond:
      `;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/responses",
      {
        model: process.env.GROQ_MODEL,
        input: fullPrompt,
        temperature: 0.6
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

    if (!messageOutput) {
      throw new Error("No message output from model");
    }

    const textContent = messageOutput.content.find(
      item => item.type === "output_text"
    );

    if (!textContent) {
      throw new Error("No text content in message");
    }

    return textContent.text;

  } catch (error) {
    console.error("LLM Error:", error.response?.data || error.message);
    throw new Error("Failed to generate reply");
  }
};
