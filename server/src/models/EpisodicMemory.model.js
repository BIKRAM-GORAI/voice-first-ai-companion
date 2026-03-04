import mongoose from "mongoose";

const episodicMemorySchema = new mongoose.Schema({
  event: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastReferenced: {
    type: Date,
    default: null
  }
});

export const EpisodicMemory = mongoose.model(
  "EpisodicMemory",
  episodicMemorySchema
);