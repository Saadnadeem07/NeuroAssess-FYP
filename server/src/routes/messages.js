const express = require("express");
const router = express.Router();

const { protectPatientOrPsychiatrist } = require("../middleware/auth");
const Message = require("../models/Message");
const Patient = require("../models/Patient");
const Psychiatrist = require("../models/Psychiatrist");
const Appointment = require("../models/Appointment");

const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const principal = (req) => ({
  id: req.patient ? req.patient._id : req.psychiatrist._id,
  model: req.patient ? "Patient" : "Psychiatrist",
  role: req.patient ? "patient" : "psychiatrist",
  name: req.patient ? req.patient.name : req.psychiatrist.name,
});

router.get(
  "/conversations",
  protectPatientOrPsychiatrist,
  asyncHandler(async (req, res) => {
    const { id: userId, model: userModel } = principal(req);
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId, senderModel: userModel },
            { receiver: userId, receiverModel: userModel },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userId] },
              { id: "$receiver", model: "$receiverModel" },
              { id: "$sender", model: "$senderModel" },
            ],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", userId] },
                    { $eq: ["$receiverModel", userModel] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
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
              "$lastMessage.senderName",
            ],
          },
          partnerRole: {
            $cond: [
              { $eq: ["$lastMessage.sender", userId] },
              "$lastMessage.receiverRole",
              "$lastMessage.senderRole",
            ],
          },
          lastMessage: "$lastMessage.content",
          lastMessageTime: "$lastMessage.createdAt",
          unreadCount: 1,
        },
      },
      { $sort: { lastMessageTime: -1 } },
    ]);
    return res.json({ success: true, data: conversations });
  })
);

router.get(
  "/conversation/:userId",
  protectPatientOrPsychiatrist,
  asyncHandler(async (req, res) => {
    const { id: currentUserId, model: currentUserModel } = principal(req);
    const partnerId = req.params.userId;

    let partnerModel;
    if (await Patient.findById(partnerId)) partnerModel = "Patient";
    else if (await Psychiatrist.findById(partnerId)) partnerModel = "Psychiatrist";
    else throw AppError.notFound("Conversation partner not found");

    if (req.patient) {
      const hasAppointment = await Appointment.findOne({
        patient: currentUserId,
        psychiatrist: partnerId,
        status: { $ne: "cancelled" },
      });
      if (!hasAppointment) {
        throw AppError.forbidden(
          "You can only message psychiatrists you have appointments with"
        );
      }
    }

    const messages = await Message.find({
      $or: [
        {
          sender: currentUserId,
          senderModel: currentUserModel,
          receiver: partnerId,
          receiverModel: partnerModel,
        },
        {
          sender: partnerId,
          senderModel: partnerModel,
          receiver: currentUserId,
          receiverModel: currentUserModel,
        },
      ],
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      {
        sender: partnerId,
        senderModel: partnerModel,
        receiver: currentUserId,
        receiverModel: currentUserModel,
        isRead: false,
      },
      { isRead: true }
    );

    return res.json({ success: true, data: messages });
  })
);

router.post(
  "/",
  protectPatientOrPsychiatrist,
  asyncHandler(async (req, res) => {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) {
      throw AppError.badRequest("Receiver ID and message content are required");
    }
    const sender = principal(req);
    let receiver = await Patient.findById(receiverId);
    let receiverModel = "Patient";
    let receiverRole = "patient";
    if (!receiver) {
      receiver = await Psychiatrist.findById(receiverId);
      receiverModel = "Psychiatrist";
      receiverRole = "psychiatrist";
    }
    if (!receiver) throw AppError.notFound("Receiver not found");

    if (req.patient && receiverModel === "Psychiatrist") {
      const hasAppointment = await Appointment.findOne({
        patient: sender.id,
        psychiatrist: receiverId,
        status: { $ne: "cancelled" },
      });
      if (!hasAppointment) {
        throw AppError.forbidden(
          "You can only message psychiatrists you have appointments with"
        );
      }
    }

    const message = await Message.create({
      sender: sender.id,
      senderModel: sender.model,
      senderName: sender.name,
      senderRole: sender.role,
      receiver: receiverId,
      receiverModel,
      receiverName: receiver.name,
      receiverRole,
      content,
      isRead: false,
    });
    return res.status(201).json({ success: true, data: message });
  })
);

router.get(
  "/unread-count",
  protectPatientOrPsychiatrist,
  asyncHandler(async (req, res) => {
    const { id: userId, model: userModel } = principal(req);
    const count = await Message.countDocuments({
      receiver: userId,
      receiverModel: userModel,
      isRead: false,
    });
    return res.json({ success: true, data: { count } });
  })
);

router.put(
  "/mark-read",
  protectPatientOrPsychiatrist,
  asyncHandler(async (req, res) => {
    const { messageIds } = req.body;
    const { id: userId, model: userModel } = principal(req);
    if (!messageIds || !Array.isArray(messageIds)) {
      throw AppError.badRequest("Message IDs array is required");
    }
    const result = await Message.updateMany(
      { _id: { $in: messageIds }, receiver: userId, receiverModel: userModel },
      { isRead: true }
    );
    return res.json({ success: true, data: { modifiedCount: result.modifiedCount } });
  })
);

module.exports = router;
