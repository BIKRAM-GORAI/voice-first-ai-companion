export const speakText = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);

  const voices = window.speechSynthesis.getVoices();

  // Log voices once to inspect
  console.log(voices);

  // Try to find a better voice manually
  const preferredVoice = voices.find(v =>
    v.name.includes("Google") || 
    v.name.includes("Microsoft") ||
    v.name.includes("Natural")
  );

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.rate = 0.95;   // Slightly slower = more natural
  utterance.pitch = 1.05;  // Slight variation
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
};