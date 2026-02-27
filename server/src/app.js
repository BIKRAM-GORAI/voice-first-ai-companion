import express from "express";
import cors from "cors";
import voiceRoutes from "./routes/voice.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", voiceRoutes);

app.get("/", (req, res) => {
  res.send("Voice-First AI Companion Backend is running 🚀");
});

app.get("/ping", (req, res) => {
  res.json({ message: "Server is running 🚀" });
});

export default app;