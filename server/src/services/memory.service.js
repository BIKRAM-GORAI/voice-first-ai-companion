import { CoreProfile } from "../models/CoreProfile.model.js";

export const ensureCoreProfile = async () => {
  const existing = await CoreProfile.findOne();

  if (!existing) {
    await CoreProfile.create({
      name: "Bikram",
      field: "Computer Science Engineering",
      careerGoal: "Product-based company",
      personalityPreference: "Calm, growth-oriented, logical",
      communicationStyle: "Supportive but not dramatic"
    });

    console.log("Core profile created ✅");
  }
};