import axios from "axios";

export const summarizeConversation = async (existingSummary, recentChunk) => {
  try {

    const prompt = `
You are compressing conversation context.

Existing summary:
${existingSummary || "None"}

New conversation chunk:
${recentChunk}

Task:
Condense both into a concise summary under 200 words.
Preserve:
- Main topic
- Key decisions
- Ongoing goals
- Open questions
Remove repetition.
Do not add advice.
Return only the summary text.
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/responses",
      {
        model: process.env.GROQ_MODEL,
        input: prompt,
        temperature: 0.3
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

    return textContent.text;

  } catch (error) {
    console.error("Summary Error:", error.response?.data || error.message);
    return existingSummary; // fallback safety
  }
};