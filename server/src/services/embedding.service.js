// import axios from "axios";

// export const generateEmbedding = async (text) => {

//   try {

//     const response = await axios.post(
//       "https://api.groq.com/openai/v1/embeddings",
//       {
//         model: "text-embedding-3-small",
//         input: text
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     return response.data.data[0].embedding;

//   } catch (error) {

//     console.error("Embedding error:", error.message);
//     return null;

//   }

// };
import { pipeline } from "@xenova/transformers";

let extractor = null;

export const generateEmbedding = async (text) => {

  try {

    if (!extractor) {

      extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );

    }

    const result = await extractor(text, {
      pooling: "mean",
      normalize: true
    });

    return Array.from(result.data);

  } catch (error) {

    console.error("Embedding error:", error.message);

    return null;

  }

};