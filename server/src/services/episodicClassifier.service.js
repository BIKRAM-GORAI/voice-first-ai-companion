import axios from "axios";

export const classifyEpisodicEvent = async (userText, assistantReply) => {
  const lower = userText.toLowerCase();

  if (
    lower.includes("today") ||
    lower.includes("tonight") ||
    lower.includes("night") ||
    lower.includes("morning") ||
    lower.includes("evening") ||
    lower.includes("afternoon")
  ) {
    return `User mentioned: ${userText}`;
  }
  try {
    const prompt = `
You are an episodic memory detector for an AI companion.

Your job is to detect whether the conversation contains
an EVENT that happened to the user today.

Examples of episodic memories:
- User mentioned feeling stuck while writing their book today.
- User talked about training or exercise progress.
- User said they started working on something.
- User described a meaningful moment or struggle today.

Do NOT store:
- greetings
- simple questions
- general advice requests

User message:
"${userText}"

Assistant reply:
"${assistantReply}"

Rules:
If this interaction represents something that happened
to the user today, return ONE short sentence describing it.

Example:
User felt stuck while writing their book today.

If there is no meaningful event, return:

null

IMPORTANT:
Return ONLY the sentence or the word null.
Do not explain.
Strictly Do not leave the response empty.
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: process.env.GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "You detect episodic events.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 60,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    let eventText = response?.data?.choices?.[0]?.message?.content?.trim();

    if (!eventText) {
      eventText = "null";
    }

    console.log("EPISODIC CLASSIFIER RESPONSE:", eventText);

    if (!eventText || eventText === "null") {
      return null;
    }

    return eventText;
  } catch (error) {
    console.error(
      "Episodic classifier error:",
      error.response?.data || error.message,
    );

    return null;
  }
};
