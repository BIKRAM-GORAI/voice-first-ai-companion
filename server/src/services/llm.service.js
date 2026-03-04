import axios from "axios";
import { systemPrompt } from "../config/systemPrompt.js";

export const generateReply = async (
  userText,
  memories = [],
  contextualBlock = ""
) => {
  try {

    /* ------------------------------ */
    /* Build memory section          */
    /* ------------------------------ */

    const memorySection =
      memories && memories.length > 0
        ? `Relevant long-term memory:\n${memories.join("\n")}\n`
        : "";

    /* ------------------------------ */
    /* Construct messages once       */
    /* ------------------------------ */

    const messages = [
      // {
      //   role: "system",
      //   content: systemPrompt
      // },
      {
        role: "system",
        content: `systemPrompt + "\n\n" +
        ${contextualBlock || ""}\n${memorySection}`
      },
      {
        role: "user",
        content: userText
      }
    ];

    /* ------------------------------ */
    /* First request                  */
    /* ------------------------------ */

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: process.env.GROQ_MODEL,
        messages: messages,
        temperature: 0.4,
        max_tokens: 300
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let reply =
      response?.data?.choices?.[0]?.message?.content?.trim();

    /* ------------------------------ */
    /* Retry if model fails           */
    /* ------------------------------ */

    if (!reply || reply.includes("not able to respond")) {

      console.log("⚠️ LLM response invalid — retrying...");

      const retry = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: process.env.GROQ_MODEL,
          messages: messages,
          temperature: 0.4,
          max_tokens: 300
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      reply =
        retry?.data?.choices?.[0]?.message?.content?.trim();
    }

    /* ------------------------------ */
    /* Final safety fallback          */
    /* ------------------------------ */

    if (!reply || reply.trim() === "") {
      return "I'm not able to respond to that request right now. Try asking something else.";
    }

    return reply;

  } catch (error) {

    console.error(
      "LLM Error:",
      error?.response?.data || error.message
    );

    return "Something went wrong while generating the response. Please try again.";
  }
};