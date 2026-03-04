import mongoose from "mongoose";

const PersonalityMemorySchema = new mongoose.Schema({
  trait: {
    type: String,
    required: true,
    unique: true
  },

  weight: {
    type: Number,
    default: 1
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export const PersonalityMemory = mongoose.model(
  "PersonalityMemory",
  PersonalityMemorySchema
);