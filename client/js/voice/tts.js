let currentUtterance = null;

export const speakText = (text) => {
  // Cancel any existing speech first
  window.speechSynthesis.cancel();

  currentUtterance = new SpeechSynthesisUtterance(text);

  currentUtterance.rate = 0.95;
  currentUtterance.pitch = 1;
  currentUtterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v =>
    v.name.includes("Google") ||
    v.name.includes("Microsoft") ||
    v.name.includes("Natural")
  );

  if (preferredVoice) {
    currentUtterance.voice = preferredVoice;
  }

  window.speechSynthesis.speak(currentUtterance);
};

export const stopSpeaking = () => {
  window.speechSynthesis.cancel();
};