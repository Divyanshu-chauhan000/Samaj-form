const { getAvailableRecords } = require("./submissionController");

const exportToCsv = async (req, res) => {
  try {
    const records = await getAvailableRecords();

    const headers = [
      "पंजीयन क्रमांक (Registration ID)",
      "जमा तिथि (Submission Date)",
      "मुखिया का नाम (Head Name)",
      "गौत्र / मूल गाँव (Head Gotra/Village)",
      "आयु (Head Age)",
      "शिक्षा (Head Education)",
      "मोबाईल नं. (Mobile Number)",
      "पिता का नाम (Father Name)",
      "पिता का गौत्र (Father Gotra)",
      "माता का नाम (Mother Name)",
      "माता का गौत्र (Mother Gotra)",
      "पत्नी का नाम (Wife Name)",
      "पत्नी का गौत्र (Wife Gotra)",
      "पत्नी की आयु (Wife Age)",
      "पत्नी की शिक्षा (Wife Education)",
      "ससुर जी का नाम (Father-in-law Name)",
      "ससुर जी का गौत्र (Father-in-law Gotra)",
      "सासू जी का नाम (Mother-in-law Name)",
      "सासू जी का गौत्र (Mother-in-law Gotra)",
      "वर्तमान निवास स्थान (Current Address)",
      "स्थाई निवास (Permanent Address)",
      "व्यवसाय 1 (Occupation 1)",
      "व्यवसाय 2 (Occupation 2)",
      "अन्य विवरण (Other Details)",
      "फोटो (Photo URL)",
      "हस्ताक्षर (Signature URL)",
      "स्थाई निवास बेरा",
      "स्थाई निवास गाँव",
      "स्थाई निवास तह",
      "स्थाई निवास जिला",
      "पारिवारिक सदस्य संख्या (Family Members Count)",
      "पारिवारिक सदस्य विवरण (Family Members List)",
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const cleanStr = String(str).replace(/"/g, '""').replace(/\r?\n/g, " ");
      return `"${cleanStr}"`;
    };

    const rows = records.map((r) => {
      const membersText = (r.members || [])
        .filter((m) => m.name && m.name.trim() !== "")
        .map(
          (m) =>
            `${m.name} (${m.relation || "सदस्य"}, आयु: ${m.age || "—"}, शिक्षा: ${m.education || "—"}, व्यवसाय: ${m.occupation || "—"}, मोबाइल: ${m.mobile || "—"})`,
        )
        .join(" | ");

      return [
        escapeCsv(r.registrationId),
        escapeCsv(r.submissionDate),
        escapeCsv(r.headName),
        escapeCsv(r.headVillage),
        escapeCsv(r.headAge),
        escapeCsv(r.headEducation),
        escapeCsv(r.mobileNumber),
        escapeCsv(r.fatherName),
        escapeCsv(r.fatherGotra),
        escapeCsv(r.motherName),
        escapeCsv(r.motherGotra),
        escapeCsv(r.wifeName),
        escapeCsv(r.wifeVillage),
        escapeCsv(r.wifeAge),
        escapeCsv(r.wifeEducation),
        escapeCsv(r.fatherInLawName),
        escapeCsv(r.fatherInLawVillage),
        escapeCsv(r.motherInLawName),
        escapeCsv(r.motherInLawVillage),
        escapeCsv(r.currentAddress),
        escapeCsv(r.permanentAddress),
        escapeCsv(r.occupation1),
        escapeCsv(r.occupation2),
        escapeCsv(r.otherDetails),
        escapeCsv(r.photoUrl),
        escapeCsv(r.signatureUrl),
        escapeCsv(r.permanentBera),
        escapeCsv(r.permanentVillage),
        escapeCsv(r.permanentTehsil),
        escapeCsv(r.permanentDistrict),
        escapeCsv((r.members || []).filter((m) => m.name).length),
        escapeCsv(membersText),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="samaj_parichay_all_records_A_to_Z.csv"',
    );
    res.send(csvContent);
  } catch (err) {
    res.status(500).send("Export error: " + err.message);
  }
};

module.exports = {
  exportToCsv,
};
