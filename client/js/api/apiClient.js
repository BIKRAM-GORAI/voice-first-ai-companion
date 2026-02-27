import { BACKEND_URL } from "../../config.js";

export const sendAudioToBackend = async (audioBlob) => {
  const formData = new FormData();
  formData.append("audio", audioBlob);

  const response = await fetch(`${BACKEND_URL}/api/voice`, {
    method: "POST",
    body: formData
  });

  return response.json();
};