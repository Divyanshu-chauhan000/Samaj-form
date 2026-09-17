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
  findBestMatchingRecord,
};
