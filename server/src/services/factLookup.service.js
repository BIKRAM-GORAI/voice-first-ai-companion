import { LongTermMemory } from "../models/LongTermMemory.model.js";

export const factLookup = async (userText) => {

  const lower = userText.toLowerCase();

  if (lower.includes("birthday")) {

    const memory = await LongTermMemory.findOne({
      tags: { $in: ["birthday"] }
    });

    if (memory) {
      return memory.content;
    }

  }

  if (lower.includes("my name")) {

    const memory = await LongTermMemory.findOne({
      tags: { $in: ["name"] }
    });

    if (memory) {
      return memory.content;
    }

  }

  if (lower.includes("fitness") || lower.includes("strength")) {

    const memory = await LongTermMemory.findOne({
      tags: { $in: ["fitness", "strength"] }
    });

    if (memory) {
      return memory.content;
    }

  }

  return null;
};