import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true
  },
  content: {
    type: String,
    required: true
  }
}, { _id: false });

const conversationSessionSchema = new mongoose.Schema({
  summary: {
    type: String,
    default: ""
  },
  recent: {
    type: [messageSchema],
    default: []
  }
}, { timestamps: true });

export const ConversationSession = mongoose.model(
  "ConversationSession",
  conversationSessionSchema
);