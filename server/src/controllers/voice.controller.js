export const handleVoiceRequest = async (req, res) => {
  try {
    console.log("Voice request received");

    // For now just test response
    res.json({
      reply: "Voice endpoint is working 🎙️"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};