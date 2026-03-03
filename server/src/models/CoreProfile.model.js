import mongoose from "mongoose";

const coreProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  field: String,
  careerGoal: String,
  personalityPreference: String,
  communicationStyle: String
}, { timestamps: true });

export const CoreProfile = mongoose.model("CoreProfile", coreProfileSchema);