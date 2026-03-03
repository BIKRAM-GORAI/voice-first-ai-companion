// import axios from "axios";
// import { systemPrompt } from "../config/systemPrompt.js";


// export const generateReply = async (userText, memories = [], contextualBlock = "") => {
//   try {

//     const memorySection = memories.length > 0
//       ? `\nRelevant context:\n${memories.join("\n")}\n`
//       : "";

//       const fullPrompt = `
//       You are Anya.

//       You are calm, grounded, and steady.
//       You speak directly to Bikram.

//       Respond in a single natural paragraph.
//       Maximum 4 sentences.
//       No bullet points.
//       No numbered lists.
//       No clichés.
//       No motivational reassurance.
//       No soft coaching language such as "it might help" or "take a step back".
//       No long explanations.
//       Avoid phrases like "your own journey" or abstract self-help language.
//       Be concrete and specific.
//       Do not use his name unless grounding is necessary. Most responses should not include his name.

//       Occasionally, if relevant to growth or consistency,
//       you may briefly reference a grounded real-world pattern or observation in 1 sentence.
//       Do not name celebrities unless specifically asked.
//       Keep it subtle.

      
//       Domain context:
//       When the user mentions DSA, interpret it as Data Structures and Algorithms.


//       Do not fabricate personal experiences, physical surroundings, 
//       or activities you are doing.

//       Structure rules:

//       If the user expresses a clear emotional state, briefly acknowledge it in one short sentence.

//       If the user is asking a neutral or technical question, do not insert emotional interpretation.
//       Only acknowledge emotion if the user explicitly states feelings 
//       (e.g., "I feel", "I'm frustrated", "I'm anxious", "I'm worried").

//       Do not infer emotions from neutral statements, clarification, 
//       or technical questions.

//       Do not start responses with:
//       "You seem"
//       "You appear"
//       "You're worried"
//       "I sense"

//       Then provide a grounded, specific response.

//       At most one direct, sharp question if clarification is useful.

//       ${memorySection}
//       ${contextualBlock}

//       User says:
//       "${userText}"

//       Respond:
//       `;

//     const response = await axios.post(
//       "https://api.groq.com/openai/v1/responses",
//       {
//         model: process.env.GROQ_MODEL,
//         input: fullPrompt,
//         temperature: 0.6
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );


//     const messageOutput = response.data.output.find(
//       item => item.type === "message"
//     );

//     if (!messageOutput) {
//       throw new Error("No message output from model");
//     }

//     const textContent = messageOutput.content.find(
//       item => item.type === "output_text"
//     );

//     if (!textContent) {
//       throw new Error("No text content in message");
//     }

//     return textContent.text;

//   } catch (error) {
//     console.error("LLM Error:", error.response?.data || error.message);
//     throw new Error("Failed to generate reply");
//   }
// };




import axios from "axios";
import { systemPrompt } from "../config/systemPrompt.js";

export const generateReply = async (userText, memories = [], contextualBlock = "") => {
  try {

    const memorySection = memories.length > 0
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

    return response.data.choices[0].message.content;

  } catch (error) {
    console.error("LLM Error:", error.response?.data || error.message);
    throw new Error("Failed to generate reply");
  }
};