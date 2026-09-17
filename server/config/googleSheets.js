const { google } = require("googleapis");

const columnNumberToLetter = (columnNumber) => {
  let column = "";
  let number = columnNumber;
  while (number > 0) {
    const remainder = (number - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    number = Math.floor((number - 1) / 26);
  }
  return column;
};
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
      "Created At",
      "Latest Updated",
      "स्थाई निवास बेरा",
      "स्थाई निवास गाँव",
      "स्थाई निवास तह",
      "स्थाई निवास जिला",
    ];

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

    const familyHeadersRange = await sheets.spreadsheets.values
      .get({ spreadsheetId, range: "Families!A1:AB1" })
      .catch(() => null);
    const existingFamilyHeaders = familyHeadersRange?.data?.values?.[0] || [];
    if (existingFamilyHeaders.length > 0) {
      const headersToAdd = familyHeaders.slice(existingFamilyHeaders.length);
      if (headersToAdd.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Families!${columnNumberToLetter(existingFamilyHeaders.length + 1)}1`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [headersToAdd] },
        });
      }
    }
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

module.exports = {
  getGoogleSheetsClient,
  ensureSheetsHeaders,
  deleteRowsFromGoogleSheet,
};
