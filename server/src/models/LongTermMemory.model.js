import mongoose from "mongoose";

const longTermMemorySchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["struggle", "goal", "emotional_pattern", "project", "habit", "insight"]
  },

  content: {
    type: String,
    required: true
  },

  tags: {
    type: [String],
    default: []
  },

  importanceScore: {
    type: Number,
    default: 3
  },

  lastReferenced: {
    type: Date,
    default: null
  }

}, { timestamps: true });

export const LongTermMemory = mongoose.model("LongTermMemory", longTermMemorySchema);