import axios from "axios";
import { systemPrompt } from "../config/systemPrompt.js";

export const generateReply = async (userText, memories = [], contextualBlock = "") => {
  try {

    const memorySection =
      memories.length > 0
        ? `Relevant long-term memory:\n${memories.join("\n")}\n`
        : "";

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: process.env.GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "system",
            content: contextualBlock + "\n" + memorySection
          },
          {
            role: "user",
            content: userText
          }
        ],
        temperature: 0.6,
        max_tokens: 300
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response?.data?.choices?.[0]?.message?.content;

    // Safe fallback if model returns empty response
    if (!reply || reply.trim() === "") {
      return "I'm not able to respond to that request right now. Try asking something else.";
    }

    return reply;

  } catch (error) {
    console.error("LLM Error:", error.response?.data || error.message);

    return "Something went wrong while generating the response. Please try again.";
  }
};