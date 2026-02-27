import axios from "axios";
import FormData from "form-data";

export const transcribeAudio = async (audioBuffer) => {
  try {
    const formData = new FormData();

    formData.append("file", audioBuffer, {
      filename: "audio.webm"
    });

    formData.append("model", "whisper-large-v3");

    const response = await axios.post(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        }
      }
    );

    return response.data.text;

  } catch (error) {
    console.error("STT Error:", error.response?.data || error.message);
    throw new Error("Failed to transcribe audio");
  }
};