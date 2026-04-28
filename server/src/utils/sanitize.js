// Serializers that strip sensitive fields before sending to clients.
// Mongoose documents are converted via .toObject() if needed.

const toPlain = (doc) => {
  if (!doc) return null;
  return typeof doc.toObject === "function" ? doc.toObject() : doc;
};

const stripSensitive = (obj) => {
  if (!obj) return obj;
  const {
    password,
    otp,
    loginOtp,
    resetPasswordToken,
    resetPasswordExpires,
    __v,
    ...rest
  } = obj;
  return rest;
};

const safePatient = (doc) => stripSensitive(toPlain(doc));

const safePsychiatrist = (doc) => stripSensitive(toPlain(doc));

const safeAdmin = (doc) => stripSensitive(toPlain(doc));

const safeAccount = (doc) => stripSensitive(toPlain(doc));

// Public-facing psychiatrist directory: drop PII the public should not see.
const publicPsychiatristFields = (doc) => {
  const obj = toPlain(doc);
  if (!obj) return obj;
  return {
    _id: obj._id,
    name: obj.name,
    expertise: obj.expertise,
    bio: obj.bio,
    specializations: obj.specializations,
    education: obj.education,
    years_of_experience: obj.years_of_experience,
    degrees: obj.degrees,
    availability: obj.availability,
    isApproved: obj.isApproved,
    gender: obj.gender,
  };
};

module.exports = {
  safePatient,
  safePsychiatrist,
  safeAdmin,
  safeAccount,
  publicPsychiatristFields,
};
