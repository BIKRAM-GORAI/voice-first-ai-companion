import { startRecording, stopRecording } from "./voice/recorder.js";
import { sendAudioToBackend } from "./api/apiClient.js";
import { speakText } from "./voice/tts.js";

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

startBtn.addEventListener("click", async () => {
  console.log("Listening...");
  await startRecording();
});

stopBtn.addEventListener("click", async () => {
  console.log("Processing...");
  const audioBlob = await stopRecording();

  const result = await sendAudioToBackend(audioBlob);

  console.log("Transcript:", result.transcript);
  console.log("Reply:", result.reply);

  speakText(result.reply);
});