import mongoose from "mongoose";

const longTermMemorySchema = new mongoose.Schema(
  {
    category: String, // emotional_pattern | goal | struggle | insight
    content: String,
    importanceScore: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export const LongTermMemory = mongoose.model(
  "LongTermMemory",
  longTermMemorySchema,
);
