// import mongoose from "mongoose";

// const longTermMemorySchema = new mongoose.Schema({
//   category: {
//     type: String,
//     enum: ["struggle", "goal", "emotional_pattern", "project", "habit", "insight"]
//   },

//   content: {
//     type: String,
//     required: true
//   },

//   tags: {
//     type: [String],
//     default: []
//   },

//   importanceScore: {
//     type: Number,
//     default: 3
//   },

//   lastReferenced: {
//     type: Date,
//     default: null
//   }

// }, { timestamps: true });

// export const LongTermMemory = mongoose.model("LongTermMemory", longTermMemorySchema);


import mongoose from "mongoose";

const LongTermMemorySchema = new mongoose.Schema({

  category: String,

  content: String,

  tags: [String],

  importanceScore: Number,

  embedding: {
    type: [Number],
    default: []
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

export const LongTermMemory =
  mongoose.model("LongTermMemory", LongTermMemorySchema);