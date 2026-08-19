const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable proxy trust for cloud platforms like Render / Heroku
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads & data directory exist
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Static route for uploaded photos
app.use('/uploads', express.static(uploadsDir));

// Static route for built frontend
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Storage configuration for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = `photo_${Date.now()}_${Math.round(Math.random() * 1E6)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Local JSON Database Helper for robust persistence & quick read/edits
const LOCAL_DB_PATH = path.join(dataDir, 'submissions.json');
const COUNTER_PATH = path.join(dataDir, 'counter.json');

const getLocalDb = () => {
  if (!fs.existsSync(LOCAL_DB_PATH)) return [];
  try {
    const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
};

const saveLocalDb = (data) => {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

const generateNextRegistrationId = () => {
  let counter = 1;
  if (fs.existsSync(COUNTER_PATH)) {
    try {
      const cntData = JSON.parse(fs.readFileSync(COUNTER_PATH, 'utf-8'));
      counter = (cntData.counter || 0) + 1;
    } catch (e) {}
  }
  fs.writeFileSync(COUNTER_PATH, JSON.stringify({ counter }), 'utf-8');
  const padded = String(counter).padStart(5, '0');
  return `KSP-2026-${padded}`;
};

// Google Sheets API Authorization Helper
const getGoogleSheetsClient = async () => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!spreadsheetId || !clientEmail || !privateKey) {
    const missing = [];
    if (!spreadsheetId) missing.push('GOOGLE_SHEETS_ID');
    if (!clientEmail) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    if (!privateKey) missing.push('GOOGLE_PRIVATE_KEY');
    const msg = `Missing Google Service Account env vars: ${missing.join(', ')}`;
    console.warn('[Google Sheets Warning]:', msg);
    return { error: msg };
  }

  // Handle formatted private key linebreaks
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return { sheets, spreadsheetId };
  } catch (err) {
    console.error('[Google Sheets Auth Error]:', err.message);
    return { error: `Auth Error: ${err.message}` };
  }
};

// Helper: Ensure Header Rows & Tabs exist in Google Sheets
const ensureSheetsHeaders = async (sheets, spreadsheetId) => {
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existingTitles = meta.data.sheets.map(s => s.properties.title);

    const requests = [];
    if (!existingTitles.includes('Families')) {
      requests.push({ addSheet: { properties: { title: 'Families' } } });
    }
    if (!existingTitles.includes('Family Members')) {
      requests.push({ addSheet: { properties: { title: 'Family Members' } } });
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests }
      });
    }

    // Sheet 1: Families Headers
    const familyHeaders = [
      'Registration ID', 'Submission Date', 'मुखिया का नाम', 'गौत्र', 'आयु', 'शिक्षा',
      'मोबाईल नं.', 'पिता का नाम', 'पिता का गौत्र', 'माता का नाम', 'माता का गौत्र',
      'मुखिया की पत्नी का नाम', 'पत्नी का गौत्र', 'पत्नी की आयु', 'पत्नी की शिक्षा',
      'ससुर जी का नाम', 'ससुर जी का गौत्र', 'सासू जी का नाम', 'सासू जी का गौत्र',
      'वर्तमान निवास स्थान', 'स्थाई निवास', 'व्यवसाय 1', 'व्यवसाय 2', 'Photo URL', 'Signature URL', 'Other Details'
    ];

    // Sheet 2: Family Members Headers
    const memberHeaders = [
      'Registration ID', 'Member Serial Number', 'Member Name', 'Age',
      'Relation With Head', 'Education', 'Occupation', 'Marital Status', 'Mobile Number'
    ];

    const familiesVal = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Families!A1:A1' }).catch(() => null);
    if (!familiesVal || !familiesVal.data || !familiesVal.data.values || familiesVal.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Families!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [familyHeaders] }
      });
    }

    const membersVal = await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Family Members'!A1:A1" }).catch(() => null);
    if (!membersVal || !membersVal.data || !membersVal.data.values || membersVal.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "'Family Members'!A1",
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [memberHeaders] }
      });
    }
  } catch (err) {
    console.error('[Google Sheets Header Setup Error]:', err.message);
  }
};

// --- API ENDPOINTS ---

// Photo Upload Endpoint
app.post('/api/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host');
  const photoUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
  res.json({ success: true, photoUrl, filename: req.file.filename });
});

// Save / Submit Form
app.post('/api/submit', async (req, res) => {
  try {
    const formData = req.body;
    const registrationId = formData.registrationId || generateNextRegistrationId();
    const submissionDate = new Date().toLocaleString('hi-IN', { timeZone: 'Asia/Kolkata' });

    const newRecord = {
      ...formData,
      registrationId,
      submissionDate,
      updatedAt: new Date().toISOString()
    };

    // Save to Local DB first
    const db = getLocalDb();
    const existingIndex = db.findIndex(r => r.registrationId === registrationId);
    if (existingIndex >= 0) {
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
          formData.headName || '',
          formData.headVillage || '',
          formData.headAge || '',
          formData.headEducation || '',
          formData.mobileNumber || '',
          formData.fatherName || '',
          formData.fatherGotra || '',
          formData.motherName || '',
          formData.motherGotra || '',
          formData.wifeName || '',
          formData.wifeVillage || '',
          formData.wifeAge || '',
          formData.wifeEducation || '',
          formData.fatherInLawName || '',
          formData.fatherInLawVillage || '',
          formData.motherInLawName || '',
          formData.motherInLawVillage || '',
          formData.currentAddress || '',
          formData.permanentAddress || '',
          formData.occupation1 || '',
          formData.occupation2 || '',
          formData.photoUrl || '',
          formData.signatureUrl || '',
          formData.otherDetails || ''
        ];

        // Append Family
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Families!A2',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [familyRow] }
        });

        // Prepare Family Members rows
        if (formData.members && formData.members.length > 0) {
          const memberRows = formData.members
            .filter(m => m.name && m.name.trim() !== '')
            .map((m, index) => [
              registrationId,
              index + 1,
              m.name || '',
              m.age || '',
              m.relation || '',
              m.education || '',
              m.occupation || '',
              m.maritalStatus || '',
              m.mobile || ''
            ]);

          if (memberRows.length > 0) {
            await sheets.spreadsheets.values.append({
              spreadsheetId,
              range: "'Family Members'!A2",
              valueInputOption: 'USER_ENTERED',
              requestBody: { values: memberRows }
            });
          }
        }
        googleSheetSaved = true;
      } catch (gErr) {
        console.error('[Google Sheet Save Warning]:', gErr.message);
        googleSheetError = gErr.message;
      }
    }

    res.json({
      success: true,
      message: 'फॉर्म सफलतापूर्वक सहेजा गया!',
      registrationId,
      record: newRecord,
      googleSheetSaved,
      googleSheetError
    });

  } catch (error) {
    console.error('Submit API Error:', error);
    res.status(500).json({ success: false, message: 'रिकॉर्ड सेव करने में त्रुटि हुई: ' + error.message });
  }
});

// Get All Submissions (Admin)
app.get('/api/records', (req, res) => {
  const db = getLocalDb();
  res.json({ success: true, records: db });
});

// Get Single Record by Registration ID
app.get('/api/records/:id', (req, res) => {
  const db = getLocalDb();
  const record = db.find(r => r.registrationId === req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: 'रिकॉर्ड नहीं मिला' });
  }
  res.json({ success: true, record });
});

// Delete Record
app.delete('/api/records/:id', (req, res) => {
  let db = getLocalDb();
  const initialLength = db.length;
  db = db.filter(r => r.registrationId !== req.params.id);
  saveLocalDb(db);
  res.json({ success: true, message: 'रिकॉर्ड सफलतापूर्वक हटा दिया गया' });
});

// Catch-all route to serve SPA frontend for any unknown path (Express 5 syntax)
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// Server listener
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Samaj Parichay Form Backend Running on Port ${PORT}`);
  console.log(` Local DB: ${LOCAL_DB_PATH}`);
  console.log(` Uploads: ${uploadsDir}`);
  console.log(`=================================================`);
});
