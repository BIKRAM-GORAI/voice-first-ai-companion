// import { BACKEND_URL } from "../../config.js";

// export const sendAudioToBackend = async (audioBlob) => {
//   const formData = new FormData();
//   formData.append("audio", audioBlob);

//   const response = await fetch(`${BACKEND_URL}/api/voice`, {
//     method: "POST",
//     body: formData
//   });

//   return response.json();
// };

import { BACKEND_URL } from "../../config.js";

export const sendAudioToBackend = async (audioBlob) => {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob);

    const response = await fetch(`${BACKEND_URL}/api/voice`, {
      method: "POST",
      body: formData
    });

    // Check if response is OK (status 200–299)
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Error sending audio to backend:", error);

    // Return a safe fallback instead of crashing
    return {
      success: false,
      message: "Unable to connect to server. Please try again."
    };
  }
};