const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "senderModel"
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["Patient", "Psychiatrist"]
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "receiverModel"
    },
    receiverModel: {
      type: String,
      required: true,
      enum: ["Patient", "Psychiatrist"]
    },
    content: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    senderName: {
      type: String,
      required: true,
    },
    receiverName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["patient", "psychiatrist"],
      required: true
    },
    receiverRole: {
      type: String,
      enum: ["patient", "psychiatrist"],
      required: true
    }
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message; 