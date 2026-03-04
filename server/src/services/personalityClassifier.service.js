import axios from "axios";

export const classifyPersonality = async (userText) => {

  const prompt = `
You are a personality trait detector for an AI companion.

Analyze the user's message.

User message:
"${userText}"

Determine if the message reveals a stable personality trait.

Examples of traits:

- reflective thinker
- emotionally expressive
- curious learner
- disciplined
- introspective
- analytical thinker
- creative writer
- philosophical

Do NOT detect temporary emotions.

Examples that should NOT be stored:

"I'm sad today"
"I'm tired"
"I feel frustrated"

Return ONLY ONE of the following:

1) trait name

Example:
creative writer

OR

2) null

Do not explain.
Do not add extra text.
`;

  try {

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

    const result =
      response.data.output[1]?.content[0]?.text?.trim() || null;

    if (!result || result === "null") return null;

    return result.toLowerCase();

  } catch (error) {

    console.error("Personality classifier error:", error.message);
    return null;

  }

};