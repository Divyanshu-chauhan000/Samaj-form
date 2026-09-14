const mongoose = require("mongoose");

const FamilyMemberSchema = new mongoose.Schema({
  id: { type: Number },
  name: { type: String, default: "" },
  age: { type: String, default: "" },
  relation: { type: String, default: "" },
  education: { type: String, default: "" },
  occupation: { type: String, default: "" },
  maritalStatus: { type: String, default: "" },
  mobile: { type: String, default: "" },
  registrationId: { type: String, default: "" },
});

const SubmissionSchema = new mongoose.Schema(
  {
    registrationId: { type: String, required: true, unique: true, index: true },
    isEdit: { type: Boolean, default: false },
    headName: { type: String, default: "" },
    headAge: { type: String, default: "" },
    headEducation: { type: String, default: "" },
    headVillage: { type: String, default: "" },
    mobileNumber: { type: String, default: "" },
    fatherName: { type: String, default: "" },
    fatherGotra: { type: String, default: "" },
    motherName: { type: String, default: "" },
    motherGotra: { type: String, default: "" },
    wifeName: { type: String, default: "" },
    wifeAge: { type: String, default: "" },
    wifeEducation: { type: String, default: "" },
    wifeVillage: { type: String, default: "" },
    fatherInLawName: { type: String, default: "" },
    fatherInLawVillage: { type: String, default: "" },
    motherInLawName: { type: String, default: "" },
    motherInLawVillage: { type: String, default: "" },
    currentAddress: { type: String, default: "" },
    permanentAddress: { type: String, default: "" },
    occupation1: { type: String, default: "" },
    occupation2: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    signatureUrl: { type: String, default: "" },
    otherDetails: { type: String, default: "" },
    members: [FamilyMemberSchema],
    submissionDate: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", SubmissionSchema);
