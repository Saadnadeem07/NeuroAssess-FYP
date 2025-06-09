const express = require("express");
const router = express.Router();
const {
  protectPatient,
  protectPsychiatrist,
  protectAdmin,
  protectPatientOrPsychiatrist,
} = require("../middleware/auth");
const Message = require("../models/Message");
const Patient = require("../models/Patient");
const Psychiatrist = require("../models/Psychiatrist");
const Appointment = require("../models/Appointment");

// Get all conversations for the authenticated user (either patient or psychiatrist)
router.get("/conversations", protectPatientOrPsychiatrist, async (req, res) => {
  try {
    const userId = req.patient ? req.patient._id : req.psychiatrist._id;
    const userModel = req.patient ? "Patient" : "Psychiatrist";
    const userRole = req.patient ? "patient" : "psychiatrist";

    // Find unique conversation partners
    // This aggregation finds the most recent message for each unique conversation partner
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId, senderModel: userModel },
            { receiver: userId, receiverModel: userModel }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userId] },
              { id: "$receiver", model: "$receiverModel" },
              { id: "$sender", model: "$senderModel" }
            ]
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ["$receiver", userId] },
                  { $eq: ["$receiverModel", userModel] },
                  { $eq: ["$isRead", false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          partnerId: "$_id.id",
          partnerModel: "$_id.model",
          partnerName: {
            $cond: [
              { $eq: ["$lastMessage.sender", userId] },
              "$lastMessage.receiverName",
              "$lastMessage.senderName"
            ]
          },
          partnerRole: {
            $cond: [
              { $eq: ["$lastMessage.sender", userId] },
              "$lastMessage.receiverRole",
              "$lastMessage.senderRole"
            ]
          },
          lastMessage: "$lastMessage.content",
          lastMessageTime: "$lastMessage.createdAt",
          unreadCount: 1
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get messages for a conversation between the authenticated user and another user
router.get("/conversation/:userId", protectPatientOrPsychiatrist, async (req, res) => {
  try {
    const currentUserId = req.patient ? req.patient._id : req.psychiatrist._id;
    const currentUserModel = req.patient ? "Patient" : "Psychiatrist";
    const partnerId = req.params.userId;
    
    // Determine partner type (Patient or Psychiatrist)
    let partnerModel;
    if (await Patient.findById(partnerId)) {
      partnerModel = "Patient";
    } else if (await Psychiatrist.findById(partnerId)) {
      partnerModel = "Psychiatrist";
    } else {
      return res.status(404).json({
        success: false,
        message: "Conversation partner not found"
      });
    }

    // Check if they can communicate
    // If it's a patient, they can only message psychiatrists they've had appointments with
    if (req.patient) {
      // Check if there's at least one appointment between them
      const hasAppointment = await Appointment.findOne({
        patient: currentUserId,
        psychiatrist: partnerId,
        status: { $ne: "cancelled" }
      });

      if (!hasAppointment) {
        return res.status(403).json({
          success: false,
          message: "You can only message psychiatrists you have appointments with"
        });
      }
    }

    // Get messages between the users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, senderModel: currentUserModel, receiver: partnerId, receiverModel: partnerModel },
        { sender: partnerId, senderModel: partnerModel, receiver: currentUserId, receiverModel: currentUserModel }
      ]
    }).sort({ createdAt: 1 });

    // Mark all messages from the partner as read
    await Message.updateMany(
      {
        sender: partnerId, 
        senderModel: partnerModel, 
        receiver: currentUserId, 
        receiverModel: currentUserModel,
        isRead: false
      },
      { isRead: true }
    );

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Send a new message
router.post("/", protectPatientOrPsychiatrist, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID and message content are required"
      });
    }

    // Determine sender details
    const senderId = req.patient ? req.patient._id : req.psychiatrist._id;
    const senderModel = req.patient ? "Patient" : "Psychiatrist";
    const senderName = req.patient ? req.patient.name : req.psychiatrist.name;
    const senderRole = req.patient ? "patient" : "psychiatrist";

    // Determine receiver details
    let receiver, receiverModel, receiverName, receiverRole;
    
    const patient = await Patient.findById(receiverId);
    if (patient) {
      receiver = patient;
      receiverModel = "Patient";
      receiverName = patient.name;
      receiverRole = "patient";
    } else {
      const psychiatrist = await Psychiatrist.findById(receiverId);
      if (psychiatrist) {
        receiver = psychiatrist;
        receiverModel = "Psychiatrist";
        receiverName = psychiatrist.name;
        receiverRole = "psychiatrist";
      }
    }

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found"
      });
    }

    // If it's a patient sending a message, they can only message psychiatrists they've had appointments with
    if (req.patient && receiverModel === "Psychiatrist") {
      // Check if there's at least one appointment between them
      const hasAppointment = await Appointment.findOne({
        patient: senderId,
        psychiatrist: receiverId,
        status: { $ne: "cancelled" }
      });

      if (!hasAppointment) {
        return res.status(403).json({
          success: false,
          message: "You can only message psychiatrists you have appointments with"
        });
      }
    }

    // Create the message
    const message = await Message.create({
      sender: senderId,
      senderModel,
      senderName,
      senderRole,
      receiver: receiverId,
      receiverModel,
      receiverName,
      receiverRole,
      content,
      isRead: false
    });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get unread messages count for the authenticated user
router.get("/unread-count", protectPatientOrPsychiatrist, async (req, res) => {
  try {
    const userId = req.patient ? req.patient._id : req.psychiatrist._id;
    const userModel = req.patient ? "Patient" : "Psychiatrist";

    const count = await Message.countDocuments({
      receiver: userId,
      receiverModel: userModel,
      isRead: false
    });

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Mark messages as read
router.put("/mark-read", protectPatientOrPsychiatrist, async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.patient ? req.patient._id : req.psychiatrist._id;
    const userModel = req.patient ? "Patient" : "Psychiatrist";

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        message: "Message IDs array is required"
      });
    }

    // Only mark messages where the current user is the receiver
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: userId,
        receiverModel: userModel
      },
      { isRead: true }
    );

    res.json({
      success: true,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error("Mark messages read error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
