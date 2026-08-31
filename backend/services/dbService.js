const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "..", "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const LOCAL_DB_PATH = path.join(dataDir, "submissions.json");
const COUNTER_PATH = path.join(dataDir, "counter.json");

const extractUrl = (val) => {
  if (!val) return "";
  const str = String(val).trim();
  if (!str) return "";

  const match = str.match(/=HYPERLINK\(\s*["']([^"']+)["']/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  if (
    str.startsWith("http://") ||
    str.startsWith("https://") ||
    str.startsWith("data:image/") ||
    str.startsWith("/uploads/")
  ) {
    return str;
  }

  if (str.includes("res.cloudinary.com") || str.includes("/uploads/")) {
    const urlMatch = str.match(/(https?:\/\/[^\s"']+)/);
    if (urlMatch && urlMatch[1]) return urlMatch[1];
    const relMatch = str.match(/(\/uploads\/[^\s"']+)/);
    if (relMatch && relMatch[1]) return relMatch[1];
  }

  if (/\.(jpe?g|png|webp|gif|bmp)$/i.test(str) && !str.includes(" ")) {
    return `/uploads/${str.replace(/^uploads\//, "")}`;
  }

  if (
    str === "फोटो देखें" ||
    str === "हस्ताक्षर देखें" ||
    str.includes("देखें") ||
    str === "View Photo" ||
    str === "View Signature"
  ) {
    return "";
  }

  return "";
};

const getLocalDb = () => {
  if (!fs.existsSync(LOCAL_DB_PATH)) return [];
  try {
    const raw = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    const records = JSON.parse(raw);
    if (Array.isArray(records)) {
      return records.map((r) => ({
        ...r,
        photoUrl: extractUrl(r.photoUrl),
        signatureUrl: extractUrl(r.signatureUrl),
      }));
    }
    return [];
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

  db.forEach((r) => {
    if (r.registrationId && r.registrationId.startsWith("KSP-2026-")) {
      const parts = r.registrationId.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

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
    "utf-8"
  );
  const padded = String(nextCounter).padStart(5, "0");
  return `KSP-2026-${padded}`;
};

const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

const calculateRecordSearchScore = (record, searchTerm) => {
  const term = String(searchTerm || "").trim().toUpperCase();
  if (!term) return 0;

  const registrationId = String(record.registrationId || "").trim().toUpperCase();
  const numericSearch = normalizeDigits(term);
  const numericRegId = normalizeDigits(registrationId);
  const headMobile = normalizeDigits(record.mobileNumber);
  const headName = String(record.headName || "").trim().toUpperCase();

  let score = 0;

  if (registrationId === term) {
    score = 2000;
  } else if (registrationId.includes(term) && term.length > 3) {
    score = 1500;
  } else if (
    numericSearch &&
    numericSearch.length <= 6 &&
    numericRegId.endsWith(numericSearch)
  ) {
    score = 1200;
  }

  if (numericSearch && numericSearch.length >= 4) {
    const search10 = numericSearch.slice(-10);
    const head10 = headMobile.slice(-10);

    if (headMobile && (headMobile === numericSearch || (search10.length === 10 && head10 === search10))) {
      score = Math.max(score, 1000);
    } else if (headMobile && (headMobile.includes(numericSearch) || (search10.length >= 6 && headMobile.includes(search10)))) {
      score = Math.max(score, 800);
    }

    if (Array.isArray(record.members)) {
      for (const m of record.members) {
        const memberMobile = normalizeDigits(m.mobile);
        const member10 = memberMobile.slice(-10);
        if (memberMobile && (memberMobile === numericSearch || (search10.length === 10 && member10 === search10))) {
          score = Math.max(score, 750);
          break;
        } else if (memberMobile && memberMobile.includes(numericSearch)) {
          score = Math.max(score, 600);
          break;
        }
      }
    }
  }

  if (headName) {
    if (headName === term) {
      score = Math.max(score, 500);
    } else if (headName.includes(term) && term.length >= 3) {
      score = Math.max(score, 400);
    }
  }

  if (score === 0) return 0;

  if (record.photoUrl && record.photoUrl.trim() !== "") {
    score += 100;
  }
  if (record.signatureUrl && record.signatureUrl.trim() !== "") {
    score += 50;
  }
  if (Array.isArray(record.members) && record.members.some((m) => m.name && m.name.trim() !== "")) {
    score += 20;
  }

  return score;
};

const findBestMatchingRecord = (records, searchTerm) => {
  if (!Array.isArray(records) || records.length === 0) return null;

  let bestRecord = null;
  let highestScore = 0;

  for (const record of records) {
    const score = calculateRecordSearchScore(record, searchTerm);
    if (score > highestScore) {
      highestScore = score;
      bestRecord = record;
    }
  }

  return bestRecord;
};

module.exports = {
  getLocalDb,
  saveLocalDb,
  generateNextRegistrationId,
  extractUrl,
  findBestMatchingRecord,
};
