// const mongoose = require('mongoose');

// const psychiatristProfileSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//     unique: true
//   },
//   accountType: {
//     type: String,
//     default: 'psychaterist',
//     immutable: true // This field cannot be modified after creation
//   },
//   expertise: {
//     type: String,
//     required: [true, 'Please provide your area of expertise'],
//     trim: true
//   },
//   bio: {
//     type: String,
//     required: [true, 'Please provide a bio'],
//     trim: true
//   },
//   certificateUrl: {
//     type: String,
//     required: [true, 'Please provide your certificate URL']
//   },
//   isApproved: {
//     type: Boolean,
//     default: false
//   },
//   approvedAt: {
//     type: Date,
//     default: null
//   }
// }, {
//   timestamps: true
// });

// const PsychiatristProfile = mongoose.model('PsychiatristProfile', psychiatristProfileSchema);

// module.exports = PsychiatristProfile;
