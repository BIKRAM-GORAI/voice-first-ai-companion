import axios from "axios";
import { systemPrompt } from "../config/systemPrompt.js";


export const generateReply = async (userText) => {
  try {
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
            role: "user",
            content: userText
          }
        ],
        temperature: 0.7,
        max_tokens:280
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    console.error("LLM Error:", error.response?.data || error.message);
    throw new Error("Failed to generate reply");
  }
};