const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { google } = require("googleapis");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable proxy trust for cloud platforms like Render / Heroku
app.set("trust proxy", 1);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Ensure uploads & data directory exist
const uploadsDir = path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Static route for uploaded photos
app.use("/uploads", express.static(uploadsDir));

// Static route for built frontend
app.use(express.static(path.join(__dirname, "frontend", "dist")));

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name_here"
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Storage configuration for Multer (Cloudinary with local fallback if env not configured)
let storage;
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name_here"
) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "samaj_parichay_uploads",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    },
  });
  console.log("[Upload Storage]: Configured to use Cloudinary cloud storage.");
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      const uniqueName = `photo_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
      cb(null, uniqueName);
    },
  });
  console.warn(
    "[Upload Storage Warning]: Cloudinary keys not found in .env! Falling back to local uploads folder.",
  );
}
const upload = multer({ storage });

// Local JSON Database Helper for robust persistence & quick read/edits
const LOCAL_DB_PATH = path.join(dataDir, "submissions.json");
const COUNTER_PATH = path.join(dataDir, "counter.json");

const getLocalDb = () => {
  if (!fs.existsSync(LOCAL_DB_PATH)) return [];
  try {
    const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

const saveLocalDb = (data) => {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf-8");
};

const generateNextRegistrationId = () => {
  const db = getLocalDb();
  let maxNum = 0;

  // Scan local DB for the highest existing registration number
  db.forEach((r) => {
    if (r.registrationId && r.registrationId.startsWith("KSP-2026-")) {
      const parts = r.registrationId.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  // Also sync with counter.json file
  if (fs.existsSync(COUNTER_PATH)) {
    try {
      const cntData = JSON.parse(fs.readFileSync(COUNTER_PATH, "utf-8"));
      if (cntData.counter && cntData.counter > maxNum) {
        maxNum = cntData.counter;
      }
    } catch (e) {}
  }

  const nextCounter = maxNum + 1;
  fs.writeFileSync(
    COUNTER_PATH,
    JSON.stringify({ counter: nextCounter }),
    "utf-8",
  );
  const padded = String(nextCounter).padStart(5, "0");
  return `KSP-2026-${padded}`;
};

// Google Sheets API Authorization Helper
const getGoogleSheetsClient = async () => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!spreadsheetId || !clientEmail || !privateKey) {
    const missing = [];
    if (!spreadsheetId) missing.push("GOOGLE_SHEETS_ID");
    if (!clientEmail) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    if (!privateKey) missing.push("GOOGLE_PRIVATE_KEY");
    const msg = `Missing Google Service Account env vars: ${missing.join(", ")}`;
    console.warn("[Google Sheets Warning]:", msg);
    return { error: msg };
  }

  // Handle formatted private key linebreaks
  privateKey = privateKey.replace(/\\n/g, "\n");

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    return { sheets, spreadsheetId };
  } catch (err) {
    console.error("[Google Sheets Auth Error]:", err.message);
    return { error: `Auth Error: ${err.message}` };
  }
};

// Helper: Ensure Header Rows & Tabs exist in Google Sheets
const ensureSheetsHeaders = async (sheets, spreadsheetId) => {
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existingTitles = meta.data.sheets.map((s) => s.properties.title);

    const requests = [];
    if (!existingTitles.includes("Families")) {
      requests.push({ addSheet: { properties: { title: "Families" } } });
    }
    if (!existingTitles.includes("Family Members")) {
      requests.push({ addSheet: { properties: { title: "Family Members" } } });
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests },
      });
    }

    // Sheet 1: Families Headers
    const familyHeaders = [
      "Registration ID",
      "Submission Date",
      "मुखिया का नाम",
      "गौत्र",
      "आयु",
      "शिक्षा",
      "मोबाईल नं.",
      "पिता का नाम",
      "पिता का गौत्र",
      "माता का नाम",
      "माता का गौत्र",
      "मुखिया की पत्नी का नाम",
      "पत्नी का गौत्र",
      "पत्नी की आयु",
      "पत्नी की शिक्षा",
      "ससुर जी का नाम",
      "ससुर जी का गौत्र",
      "सासू जी का नाम",
      "सासू जी का गौत्र",
      "वर्तमान निवास स्थान",
      "स्थाई निवास",
      "व्यवसाय 1",
      "व्यवसाय 2",
      "Photo URL",
      "Signature URL",
      "Other Details",
    ];

    // Sheet 2: Family Members Headers
    const memberHeaders = [
      "Registration ID",
      "Member Serial Number",
      "Member Name",
      "Age",
      "Relation With Head",
      "Education",
      "Occupation",
      "Marital Status",
      "Mobile Number",
    ];

    const familiesVal = await sheets.spreadsheets.values
      .get({ spreadsheetId, range: "Families!A1:A1" })
      .catch(() => null);
    if (
      !familiesVal ||
      !familiesVal.data ||
      !familiesVal.data.values ||
      familiesVal.data.values.length === 0
    ) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Families!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [familyHeaders] },
      });
    }

    const membersVal = await sheets.spreadsheets.values
      .get({ spreadsheetId, range: "'Family Members'!A1:A1" })
      .catch(() => null);
    if (
      !membersVal ||
      !membersVal.data ||
      !membersVal.data.values ||
      membersVal.data.values.length === 0
    ) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "'Family Members'!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [memberHeaders] },
      });
    }
  } catch (err) {
    console.error("[Google Sheets Header Setup Error]:", err.message);
  }
};

const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

const recordMatchesSearch = (record, searchTerm) => {
  const term = String(searchTerm || "")
    .trim()
    .toUpperCase();
  if (!term) return false;

  const registrationId = String(record.registrationId || "").toUpperCase();
  if (registrationId === term || registrationId.includes(term)) return true;

  const numericSearch = normalizeDigits(term);
  if (numericSearch && normalizeDigits(registrationId).endsWith(numericSearch))
    return true;

  return numericSearch
    ? normalizeDigits(record.mobileNumber).includes(numericSearch)
    : String(record.mobileNumber || "")
        .toUpperCase()
        .includes(term);
};

const getRecordsFromGoogleSheets = async (sheets, spreadsheetId) => {
  const [familiesResult, membersResult] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId, range: "Families!A2:Z" }),
    sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Family Members'!A2:I",
    }),
  ]);

  const membersByRegistrationId = {};
  for (const row of membersResult.data.values || []) {
    const registrationId = row[0];
    if (!registrationId) continue;
    if (!membersByRegistrationId[registrationId])
      membersByRegistrationId[registrationId] = [];
    membersByRegistrationId[registrationId].push({
      registrationId,
      id: Number(row[1]) || membersByRegistrationId[registrationId].length + 1,
      name: row[2] || "",
      age: row[3] || "",
      relation: row[4] || "",
      education: row[5] || "",
      occupation: row[6] || "",
      maritalStatus: row[7] || "",
      mobile: row[8] || "",
    });
  }

  return (familiesResult.data.values || [])
    .filter((row) => row[0])
    .map((row) => ({
      registrationId: row[0],
      submissionDate: row[1] || "",
      headName: row[2] || "",
      headVillage: row[3] || "",
      headAge: row[4] || "",
      headEducation: row[5] || "",
      mobileNumber: row[6] || "",
      fatherName: row[7] || "",
      fatherGotra: row[8] || "",
      motherName: row[9] || "",
      motherGotra: row[10] || "",
      wifeName: row[11] || "",
      wifeVillage: row[12] || "",
      wifeAge: row[13] || "",
      wifeEducation: row[14] || "",
      fatherInLawName: row[15] || "",
      fatherInLawVillage: row[16] || "",
      motherInLawName: row[17] || "",
      motherInLawVillage: row[18] || "",
      currentAddress: row[19] || "",
      permanentAddress: row[20] || "",
      occupation1: row[21] || "",
      occupation2: row[22] || "",
      photoUrl: row[23] || "",
      signatureUrl: row[24] || "",
      otherDetails: row[25] || "",
      members: membersByRegistrationId[row[0]] || [],
      updatedAt: "",
    }));
};

const getAvailableRecords = async () => {
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
  return getLocalDb();
};

const deleteRowsFromGoogleSheet = async (
  sheets,
  spreadsheetId,
  sheetName,
  lastColumn,
  registrationId,
) => {
  const metadata = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = metadata.data.sheets.find(
    (item) => item.properties.title === sheetName,
  );
  if (!sheet) return;

  const rangeName =
    sheetName === "Family Members" ? "'Family Members'" : sheetName;
  const values = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${rangeName}!A2:${lastColumn}`,
  });
  const matchingRows = (values.data.values || [])
    .map((row, index) => (row[0] === registrationId ? index + 1 : -1))
    .filter((index) => index >= 0)
    .sort((a, b) => b - a);

  for (const rowIndex of matchingRows) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });
  }
};

// --- API ENDPOINTS ---

// Photo Upload Endpoint
app.post("/api/upload", upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No image uploaded" });
  }
  // If uploaded via Cloudinary, req.file.path contains full secure HTTPS URL
  const photoUrl =
    req.file.path && req.file.path.startsWith("http")
      ? req.file.path
      : `${req.headers["x-forwarded-proto"] || req.protocol || "http"}://${req.get("host")}/uploads/${req.file.filename}`;

  res.json({
    success: true,
    photoUrl,
    filename: req.file.filename || req.file.originalname,
  });
});

// Save / Submit Form
app.post("/api/submit", async (req, res) => {
  try {
    const formData = req.body;
    const db = getLocalDb();

    let registrationId = formData.registrationId;
    const existingIndex = registrationId
      ? db.findIndex((r) => r.registrationId === registrationId)
      : -1;

    // Generate NEW Registration ID if it's not explicitly an edit or if the registrationId is missing/invalid
    if (!formData.isEdit || existingIndex < 0 || !registrationId) {
      registrationId = generateNextRegistrationId();
    }

    const submissionDate = new Date().toLocaleString("hi-IN", {
      timeZone: "Asia/Kolkata",
    });

    const newRecord = {
      ...formData,
      registrationId,
      members: (formData.members || []).map((member, index) => ({
        ...member,
        registrationId,
        id: Number(member.id) || index + 1,
      })),
      submissionDate,
      updatedAt: new Date().toISOString(),
    };

    // Save to Local DB
    if (existingIndex >= 0 && formData.isEdit) {
      db[existingIndex] = newRecord;
    } else {
      db.unshift(newRecord);
    }
    saveLocalDb(db);

    // Save to Google Sheets if credentials are present
    let googleSheetSaved = false;
    let googleSheetError = null;
    const gSheets = await getGoogleSheetsClient();
    if (gSheets && gSheets.error) {
      googleSheetError = gSheets.error;
    } else if (gSheets && gSheets.sheets) {
      try {
        const { sheets, spreadsheetId } = gSheets;
        await ensureSheetsHeaders(sheets, spreadsheetId);

        // Prepare Family row
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
        ];

        // Check if family record already exists in Google Sheets
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
          // Update existing row (Header is row 1, A2 is index 0 -> row = index + 2)
          const sheetRowNumber = existingRowIndex + 2;
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Families!A${sheetRowNumber}`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [familyRow] },
          });
        } else {
          // Append new Family row
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "Families!A2",
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [familyRow] },
          });
        }

        // Prepare Family Members rows
        if (formData.members && formData.members.length > 0) {
          const memberRows = formData.members
            .filter((m) => m.name && m.name.trim() !== "")
            .map((m, index) => [
              registrationId,
              index + 1,
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
      googleSheetSaved,
      googleSheetError,
    });
  } catch (error) {
    console.error("Submit API Error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "रिकॉर्ड सेव करने में त्रुटि हुई: " + error.message,
      });
  }
});

// Get All Submissions (Admin)
app.get("/api/records", async (req, res) => {
  const records = await getAvailableRecords();
  res.json({ success: true, records });
});

// Get Single Record by Registration ID (or Numeric Part)
app.get("/api/records/:id", async (req, res) => {
  const records = await getAvailableRecords();
  const record = records.find((r) => recordMatchesSearch(r, req.params.id));

  if (!record) {
    return res
      .status(404)
      .json({
        success: false,
        message: `Registration ID या मोबाइल नंबर '${req.params.id}' नहीं मिला`,
      });
  }
  res.json({ success: true, record });
});

// Delete Record
app.delete("/api/records/:id", async (req, res) => {
  const records = await getAvailableRecords();
  const record = records.find((r) => recordMatchesSearch(r, req.params.id));
  if (!record)
    return res
      .status(404)
      .json({ success: false, message: "रिकॉर्ड नहीं मिला" });

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
      return res
        .status(500)
        .json({
          success: false,
          message: "Google Sheet से रिकॉर्ड हटाया नहीं जा सका",
        });
    }
  }
  saveLocalDb(db);
  res.json({
    success: true,
    message: "रिकॉर्ड Google Sheet और लोकल डेटा से स्थायी रूप से हटा दिया गया",
  });
});

// Catch-all route to serve SPA frontend for any unknown path (Express 5 syntax)
app.get("{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

// Server listener
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Samaj Parichay Form Backend Running on Port ${PORT}`);
  console.log(` Local DB: ${LOCAL_DB_PATH}`);
  console.log(` Uploads: ${uploadsDir}`);
  console.log(`=================================================`);
});
