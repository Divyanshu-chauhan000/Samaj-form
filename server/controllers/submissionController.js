const {
  getLocalDb,
  saveLocalDb,
  generateNextRegistrationId,
  findBestMatchingRecord,
  extractUrl,
} = require("../services/dbService");
const {
  getGoogleSheetsClient,
  ensureSheetsHeaders,
  deleteRowsFromGoogleSheet,
} = require("../config/googleSheets");
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

const getRecordsFromGoogleSheets = async (sheets, spreadsheetId) => {
  const [familiesResult, membersResult] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Families!A2:AB",
      valueRenderOption: "FORMULA",
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Family Members'!A2:I",
      valueRenderOption: "FORMATTED_VALUE",
    }),
  ]);

  const membersByRegistrationId = {};
  for (const row of membersResult.data.values || []) {
    const registrationId = row[0] ? String(row[0]).trim() : "";
    if (!registrationId) continue;
    if (!membersByRegistrationId[registrationId])
      membersByRegistrationId[registrationId] = [];
    membersByRegistrationId[registrationId].push({
      registrationId,
      id: Number(row[1]) || membersByRegistrationId[registrationId].length + 1,
      name: row[2] != null ? String(row[2]).trim() : "",
      age: row[3] != null ? String(row[3]).trim() : "",
      relation: row[4] != null ? String(row[4]).trim() : "",
      education: row[5] != null ? String(row[5]).trim() : "",
      occupation: row[6] != null ? String(row[6]).trim() : "",
      maritalStatus: row[7] != null ? String(row[7]).trim() : "",
      mobile: row[8] != null ? String(row[8]).trim() : "",
    });
  }

  return (familiesResult.data.values || [])
    .filter((row) => row && row[0] && String(row[0]).trim() !== "")
    .map((row) => {
      const regId = String(row[0]).trim();
      return {
        registrationId: regId,
        submissionDate: row[1] != null ? String(row[1]).trim() : "",
        headName: row[2] != null ? String(row[2]).trim() : "",
        headVillage: row[3] != null ? String(row[3]).trim() : "",
        headAge: row[4] != null ? String(row[4]).trim() : "",
        headEducation: row[5] != null ? String(row[5]).trim() : "",
        mobileNumber: row[6] != null ? String(row[6]).trim() : "",
        fatherName: row[7] != null ? String(row[7]).trim() : "",
        fatherGotra: row[8] != null ? String(row[8]).trim() : "",
        motherName: row[9] != null ? String(row[9]).trim() : "",
        motherGotra: row[10] != null ? String(row[10]).trim() : "",
        wifeName: row[11] != null ? String(row[11]).trim() : "",
        wifeVillage: row[12] != null ? String(row[12]).trim() : "",
        wifeAge: row[13] != null ? String(row[13]).trim() : "",
        wifeEducation: row[14] != null ? String(row[14]).trim() : "",
        fatherInLawName: row[15] != null ? String(row[15]).trim() : "",
        fatherInLawVillage: row[16] != null ? String(row[16]).trim() : "",
        motherInLawName: row[17] != null ? String(row[17]).trim() : "",
        motherInLawVillage: row[18] != null ? String(row[18]).trim() : "",
        currentAddress: row[19] != null ? String(row[19]).trim() : "",
        permanentAddress: row[20] != null ? String(row[20]).trim() : "",
        occupation1: row[21] != null ? String(row[21]).trim() : "",
        occupation2: row[22] != null ? String(row[22]).trim() : "",
        photoUrl: extractUrl(row[23]),
        signatureUrl: extractUrl(row[24]),
        otherDetails: row[25] != null ? String(row[25]).trim() : "",
        members: membersByRegistrationId[regId] || [],
        createdAt: row[26] != null ? String(row[26]).trim() : row[1] || "",
        updatedAt: row[27] != null ? String(row[27]).trim() : row[1] || "",
      };
    });
};

const getAvailableRecords = async () => {
  // 1. Try MongoDB Atlas First
  if (mongoose.connection.readyState === 1) {
    try {
      const mongoRecords = await Submission.find()
        .sort({ createdAt: -1 })
        .lean();
      if (mongoRecords && mongoRecords.length > 0) {
        saveLocalDb(mongoRecords);
        return mongoRecords;
      }
    } catch (mErr) {
      console.error("[MongoDB Read Warning]:", mErr.message);
    }
  }

  // 2. Try Google Sheets Next
  const gSheets = await getGoogleSheetsClient();
  if (gSheets && gSheets.sheets) {
    try {
      const records = await getRecordsFromGoogleSheets(
        gSheets.sheets,
        gSheets.spreadsheetId,
      );
      saveLocalDb(records);
      return records;
    } catch (err) {
      console.error("[Google Sheets Read Warning]:", err.message);
    }
  }

  // 3. Fallback to Local JSON Database
  return getLocalDb();
};

// Submit / Save Form Handler
const submitForm = async (req, res) => {
  try {
    const formData = req.body;
    const db = getLocalDb();

    let registrationId = formData.registrationId;
    const existingIndex = registrationId
      ? db.findIndex((r) => r.registrationId === registrationId)
      : -1;

    if (!formData.isEdit || !registrationId) {
      registrationId = generateNextRegistrationId();
    }

    const now = new Date();
    const timestampParts = formatTimestamp(now);
    const submissionDate = `${timestampParts.day}/${timestampParts.month}/${timestampParts.year}, ${timestampParts.hour}:${timestampParts.minute} ${timestampParts.dayPeriod.toUpperCase()}`;
    const existingRecord = existingIndex >= 0 ? db[existingIndex] : null;
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

    // 1. Save to MongoDB Atlas if connected
    let mongoSaved = false;
    if (mongoose.connection.readyState === 1) {
      try {
        await Submission.findOneAndUpdate({ registrationId }, newRecord, {
          upsert: true,
          new: true,
        });
        mongoSaved = true;
      } catch (mErr) {
        console.error("[MongoDB Save Warning]:", mErr.message);
      }
    }

    // 2. Save to Local JSON DB
    if (existingIndex >= 0 && formData.isEdit) {
      db[existingIndex] = newRecord;
    } else {
      db.unshift(newRecord);
    }
    saveLocalDb(db);

    // 3. Save to Google Sheets if configured
    let googleSheetSaved = false;
    let googleSheetError = null;
    const gSheets = await getGoogleSheetsClient();
    if (gSheets && gSheets.error) {
      googleSheetError = gSheets.error;
    } else if (gSheets && gSheets.sheets) {
      try {
        const { sheets, spreadsheetId } = gSheets;
        await ensureSheetsHeaders(sheets, spreadsheetId);

        const familyRow = [
          registrationId,
          submissionDate,
          formData.headName || "",
          formData.headVillage || "",
          formData.headAge || "",
          formData.headEducation || "",
          formData.mobileNumber || "",
          formData.fatherName || "",
          formData.fatherGotra || "",
          formData.motherName || "",
          formData.motherGotra || "",
          formData.wifeName || "",
          formData.wifeVillage || "",
          formData.wifeAge || "",
          formData.wifeEducation || "",
          formData.fatherInLawName || "",
          formData.fatherInLawVillage || "",
          formData.motherInLawName || "",
          formData.motherInLawVillage || "",
          formData.currentAddress || "",
          formData.permanentAddress || "",
          formData.occupation1 || "",
          formData.occupation2 || "",
          formData.photoUrl
            ? `=HYPERLINK("${formData.photoUrl}", "फोटो देखें")`
            : "",
          formData.signatureUrl
            ? `=HYPERLINK("${formData.signatureUrl}", "हस्ताक्षर देखें")`
            : "",
          formData.otherDetails || "",
          createdAt,
          now.toISOString(),
        ];

        let existingRowIndex = -1;
        try {
          const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Families!A2:A",
          });
          const rows = res.data.values || [];
          existingRowIndex = rows.findIndex((row) => row[0] === registrationId);
        } catch (e) {}

        if (existingRowIndex >= 0) {
          const sheetRowNumber = existingRowIndex + 2;
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Families!A${sheetRowNumber}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [familyRow] },
          });
        } else {
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "Families!A2",
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [familyRow] },
          });
        }

        if (formData.members && formData.members.length > 0) {
          const memberRows = formData.members
            .filter((m) => m.name && m.name.trim() !== "")
            .map((m, index) => [
              registrationId,
              m.id || index + 1,
              m.name || "",
              m.age || "",
              m.relation || "",
              m.education || "",
              m.occupation || "",
              m.maritalStatus || "",
              m.mobile || "",
            ]);

          if (memberRows.length > 0) {
            if (formData.isEdit) {
              await deleteRowsFromGoogleSheet(
                sheets,
                spreadsheetId,
                "Family Members",
                "I",
                registrationId,
              );
            }
            await sheets.spreadsheets.values.append({
              spreadsheetId,
              range: "'Family Members'!A2",
              valueInputOption: "USER_ENTERED",
              requestBody: { values: memberRows },
            });
          }
        }
        googleSheetSaved = true;
      } catch (gErr) {
        console.error("[Google Sheet Save Warning]:", gErr.message);
        googleSheetError = gErr.message;
      }
    }

    res.json({
      success: true,
      message: formData.isEdit
        ? "फॉर्म सफलतापूर्वक अपडेट हो गया!"
        : "फॉर्म सफलतापूर्वक सहेजा गया!",
      registrationId,
      record: newRecord,
      mongoSaved,
      googleSheetSaved,
      googleSheetError,
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
  const records = await getAvailableRecords();
  res.json({ success: true, records });
};

// Get Single Record by ID
const getRecordById = async (req, res) => {
  const records = await getAvailableRecords();
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
  const records = await getAvailableRecords();
  const record = findBestMatchingRecord(records, req.params.id);
  if (!record)
    return res
      .status(404)
      .json({ success: false, message: "रिकॉर्ड नहीं मिला" });

  if (mongoose.connection.readyState === 1) {
    try {
      await Submission.deleteOne({ registrationId: record.registrationId });
    } catch (mErr) {
      console.error("[MongoDB Delete Warning]:", mErr.message);
    }
  }

  let db = getLocalDb().filter(
    (r) => r.registrationId !== record.registrationId,
  );
  const gSheets = await getGoogleSheetsClient();
  if (gSheets && gSheets.sheets) {
    try {
      await deleteRowsFromGoogleSheet(
        gSheets.sheets,
        gSheets.spreadsheetId,
        "Families",
        "Z",
        record.registrationId,
      );
      await deleteRowsFromGoogleSheet(
        gSheets.sheets,
        gSheets.spreadsheetId,
        "Family Members",
        "I",
        record.registrationId,
      );
    } catch (err) {
      console.error("[Google Sheets Delete Warning]:", err.message);
    }
  }
  saveLocalDb(db);
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
