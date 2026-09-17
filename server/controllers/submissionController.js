const { findBestMatchingRecord } = require("../services/dbService");
const Submission = require("../models/Submission");
const mongoose = require("mongoose");

const formatTimestamp = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .formatToParts(date)
    .reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});

const getAvailableRecords = async () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB is not connected");
  }
  return Submission.find().sort({ createdAt: -1 }).lean();
};

const getRegistrationNumber = (registrationId) => {
  if (!registrationId || !String(registrationId).startsWith("KSP-2026-")) {
    return 0;
  }

  const number = Number(String(registrationId).split("-").pop());
  return Number.isInteger(number) ? number : 0;
};

const generateRegistrationId = async () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB is not connected");
  }

  const records = await Submission.find({}, { registrationId: 1, _id: 0 }).lean();
  const maxNumber = records.reduce(
    (max, record) => Math.max(max, getRegistrationNumber(record.registrationId)),
    0,
  );
  const counters = mongoose.connection.db.collection("counters");
  await counters.updateOne(
    { _id: "registration" },
    { $max: { seq: maxNumber } },
    { upsert: true },
  );
  const result = await counters.findOneAndUpdate(
    { _id: "registration" },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true },
  );
  const nextNumber = result?.value?.seq ?? result?.seq;
  if (!Number.isInteger(nextNumber)) {
    throw new Error("MongoDB counter did not return a valid serial number");
  }
  return `KSP-2026-${String(nextNumber).padStart(5, "0")}`;
};

// Submit / Save Form Handler
const submitForm = async (req, res) => {
  try {
    const formData = req.body;
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database अभी उपलब्ध नहीं है। कृपया थोड़ी देर बाद फिर प्रयास करें।",
      });
    }

    let registrationId = formData.registrationId;
    let existingRecord = registrationId
      ? await Submission.findOne({ registrationId }).lean()
      : null;

    if (formData.isEdit && registrationId && !existingRecord) {
      return res.status(404).json({
        success: false,
        message: `Registration ID ${registrationId} का रिकॉर्ड नहीं मिला।`,
      });
    }

    if (!formData.isEdit || !registrationId) {
      registrationId = await generateRegistrationId();
      existingRecord = null;
    }

    const now = new Date();
    const timestampParts = formatTimestamp(now);
    const submissionDate = `${timestampParts.day}/${timestampParts.month}/${timestampParts.year}, ${timestampParts.hour}:${timestampParts.minute} ${timestampParts.dayPeriod.toUpperCase()}`;
    const createdAt = existingRecord?.createdAt || now.toISOString();

    const newRecord = {
      ...formData,
      registrationId,
      members: (formData.members || []).map((member, index) => ({
        ...member,
        registrationId,
        id: Number(member.id) || index + 1,
      })),
      submissionDate: existingRecord?.submissionDate || submissionDate,
      createdAt,
      updatedAt: now.toISOString(),
    };

    await Submission.findOneAndUpdate({ registrationId }, newRecord, {
      upsert: true,
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: formData.isEdit
        ? "फॉर्म सफलतापूर्वक अपडेट हो गया!"
        : "फॉर्म सफलतापूर्वक सहेजा गया!",
      registrationId,
      record: newRecord,
      mongoSaved: true,
    });
  } catch (error) {
    console.error("Submit API Error:", error);
    res.status(500).json({
      success: false,
      message: "रिकॉर्ड सेव करने में त्रुटि हुई: " + error.message,
    });
  }
};

// Get All Submissions
const getAllRecords = async (req, res) => {
  try {
    const records = await getAvailableRecords();
    res.json({ success: true, records });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Database अभी उपलब्ध नहीं है।",
    });
  }
};

// Get Single Record by ID
const getRecordById = async (req, res) => {
  let records;
  try {
    records = await getAvailableRecords();
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "Database अभी उपलब्ध नहीं है।",
    });
  }
  const record = findBestMatchingRecord(records, req.params.id);

  if (!record) {
    return res.status(404).json({
      success: false,
      message: `Registration ID या मोबाइल नंबर '${req.params.id}' नहीं मिला`,
    });
  }
  res.json({ success: true, record });
};

// Delete Record
const deleteRecord = async (req, res) => {
  let records;
  try {
    records = await getAvailableRecords();
  } catch (error) {
    return res.status(503).json({
      success: false,
      message: "Database अभी उपलब्ध नहीं है।",
    });
  }
  const record = findBestMatchingRecord(records, req.params.id);
  if (!record)
    return res
      .status(404)
      .json({ success: false, message: "रिकॉर्ड नहीं मिला" });

  await Submission.deleteOne({ registrationId: record.registrationId });
  res.json({
    success: true,
    message: "रिकॉर्ड सफलतापूर्वक हटा दिया गया",
  });
};

module.exports = {
  submitForm,
  getAllRecords,
  getRecordById,
  deleteRecord,
  getAvailableRecords,
};
