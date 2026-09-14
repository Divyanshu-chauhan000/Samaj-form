import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Trash2,
  RefreshCw,  
  FileText,
  Download,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../config.js";

const formatDate = (value) => {
  if (!value) return "—";
  const text = String(value).trim();
  const legacyMatch = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i,
  );
  let date;
  if (legacyMatch) {
    let hour = Number(legacyMatch[4]);
    const meridiem = legacyMatch[7]?.toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    date = new Date(
      Number(legacyMatch[3]),
      Number(legacyMatch[2]) - 1,
      Number(legacyMatch[1]),
      hour,
      Number(legacyMatch[5]),
      Number(legacyMatch[6] || 0),
    );
  } else {
    date = new Date(text);
  }
  if (Number.isNaN(date.getTime())) return text;
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const getPart = (type) =>
    parts.find((part) => part.type === type)?.value || "";
  return `${getPart("day")}/${getPart("month")}/${getPart("year")}, ${getPart("hour")}:${getPart("minute")} ${getPart("dayPeriod").toUpperCase()}`;
};

export default function AdminRecords({
  onViewDirectoryCard,
  onViewAllDirectoryCards,
}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecordDetails, setSelectedRecordDetails] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/records`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id) => {
    if (
      !window.confirm(`क्या आप रजिस्ट्रेशन क्रमांक ${id} को हटाना चाहते हैं?`)
    )
      return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/records/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchRecords();
        if (selectedRecordDetails?.registrationId === id) {
          setSelectedRecordDetails(null);
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("हटाने में विफलता");
    }
  };

  const filteredRecords = records.filter((r) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const memberMatch =
      Array.isArray(r.members) &&
      r.members.some(
        (m) =>
          (m.name && m.name.toLowerCase().includes(term)) ||
          (m.mobile && String(m.mobile).includes(term)),
      );
    return (
      (r.registrationId && r.registrationId.toLowerCase().includes(term)) ||
      (r.headName && r.headName.toLowerCase().includes(term)) ||
      (r.mobileNumber && String(r.mobileNumber).toLowerCase().includes(term)) ||
      (r.headVillage && String(r.headVillage).toLowerCase().includes(term)) ||
      memberMatch
    );
  });

  return (
    <div className="admin-container no-print">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.6rem", color: "#7B1113", margin: 0 }}>
            पंजीकृत रिकॉर्ड प्रबंधन (Admin Records Panel)
          </h2>
          <p style={{ color: "#666", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
            कुल प्रविष्टियाँ: {records.length} | A-Z संपूर्ण डेटा उपलब्ध है
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary"
            style={{ color: "#333" }}
            onClick={fetchRecords}
          >
            <RefreshCw size={16} /> रिफ्रेश
          </button>

          <a
            href={`${API_BASE_URL}/api/export/excel`}
            className="btn btn-secondary"
            style={{
              color: "#2e7d32",
              borderColor: "#2e7d32",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: "600",
            }}
            title="A-Z सभी डेटा एक्सेल शीट (.csv) में डाउनलोड करें"
          >
            <Download size={16} /> एक्सेल एक्सपोर्ट (A-Z Data CSV)
          </a>

          <button
            className="btn btn-primary"
            style={{
              backgroundColor: "#8B0000",
              borderColor: "#8B0000",
              color: "#FFF",
              fontWeight: "600",
            }}
            onClick={() =>
              onViewAllDirectoryCards &&
              onViewAllDirectoryCards(filteredRecords)
            }
          >
            <FileText size={16} /> डायरेक्टरी कार्ड्स देखें
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="search-bar-row">
        <div style={{ position: "relative", flex: 1 }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "10px",
              color: "#888",
            }}
          />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: "38px" }}
            placeholder="मुखिया का नाम, मोबाइल नंबर, गौत्र या Registration ID से खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Records Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          डेटा लोड हो रहा है...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            background: "white",
            borderRadius: "8px",
          }}
        >
          कोई रिकॉर्ड नहीं मिला।
        </div>
      ) : (
        <table className="records-table">
          <thead>
            <tr>
              <th>पंजीयन ID</th>
              <th>मुखिया का नाम</th>
              <th>गौत्र</th>
              <th>मोबाइल नंबर</th>
              <th>सदस्य संख्या</th>
              <th>Created</th>
              <th>Latest Update</th>
              <th style={{ textAlign: "center" }}>कार्रवाई (A-Z Actions)</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((rec) => (
              <tr key={rec.registrationId}>
                <td>
                  <strong>{rec.registrationId}</strong>
                </td>
                <td>{rec.headName || "—"}</td>
                <td>{rec.headVillage || "—"}</td>
                <td>{rec.mobileNumber || "—"}</td>
                <td>
                  {rec.members ? rec.members.filter((m) => m.name).length : 0}
                </td>
                <td>{formatDate(rec.createdAt || rec.submissionDate)}</td>
                <td>
                  {formatDate(
                    rec.updatedAt || rec.createdAt || rec.submissionDate,
                  )}
                </td>
                <td style={{ textAlign: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* View A-Z Details Modal Button */}
                    <button
                      className="btn btn-secondary"
                      style={{
                        padding: "4px 10px",
                        color: "#2e7d32",
                        borderColor: "#2e7d32",
                        fontWeight: "700",
                      }}
                      onClick={() => setSelectedRecordDetails(rec)}
                      title="A to Z पूरा डेटा देखें"
                    >
                      <Eye size={15} /> A-Z विवरण
                    </button>

                    {/* Format 2: Directory Card View/Print */}
                    <button
                      className="btn btn-secondary"
                      style={{
                        padding: "4px 8px",
                        color: "#8B0000",
                        borderColor: "#8B0000",
                      }}
                      onClick={() =>
                        onViewDirectoryCard && onViewDirectoryCard(rec)
                      }
                      title="डायरेक्टरी कार्ड एवं PDF"
                    >
                      <FileText size={15} /> डायरेक्टरी कार्ड
                    </button>

                    {/* Delete */}
                    <button
                      className="btn btn-danger"
                      style={{ padding: "4px 8px" }}
                      onClick={() => handleDelete(rec.registrationId)}
                      title="हटाएं"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* A-Z COMPLETE DETAILS MODAL */}
      {selectedRecordDetails && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#FFFDF9",
              borderRadius: "12px",
              maxWidth: "850px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "24px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              border: "2px solid #8B0000",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "2px double #8B0000",
                paddingBottom: "12px",
                marginBottom: "16px",
              }}
            >
              <div>
                <h3
                  style={{
                    color: "#7B1113",
                    margin: 0,
                    fontSize: "1.3rem",
                  }}
                >
                  A-Z संपूर्ण विवरण: {selectedRecordDetails.registrationId}
                </h3>
                <span style={{ fontSize: "0.85rem", color: "#666" }}>
                  जमा करने की तारीख:{" "}
                  {formatDate(
                    selectedRecordDetails.createdAt ||
                      selectedRecordDetails.submissionDate,
                  )}
                </span>
              </div>
              <button
                onClick={() => setSelectedRecordDetails(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <X size={24} color="#666" />
              </button>
            </div>

            {/* A-Z Grid Information */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Head & Photo Section */}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  background: "#FAF5E4",
                  padding: "12px",
                  borderRadius: "8px",
                  borderLeft: "4px solid #8B0000",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    width: "110px",
                    height: "130px",
                    border: "1px dashed #8B0000",
                    background: "#FFF",
                    borderRadius: "6px",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selectedRecordDetails.photoUrl ? (
                    <img
                      src={selectedRecordDetails.photoUrl}
                      alt="Head Photo"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <span style={{ color: "#aaa", fontSize: "0.8rem" }}>
                      फोटो नहीं है
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: "240px" }}>
                  <h4
                    style={{
                      color: "#7B1113",
                      margin: "0 0 8px 0",
                      fontSize: "1.1rem",
                    }}
                  >
                    1. परिवार के मुखिया की जानकारी
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                      fontSize: "0.92rem",
                    }}
                  >
                    <div>
                      <strong>मुखिया का नाम:</strong>{" "}
                      {selectedRecordDetails.headName || "—"}
                    </div>
                    <div>
                      <strong>गौत्र / मूल गाँव:</strong>{" "}
                      {selectedRecordDetails.headVillage || "—"}
                    </div>
                    <div>
                      <strong>आयु:</strong>{" "}
                      {selectedRecordDetails.headAge
                        ? `${selectedRecordDetails.headAge} वर्ष`
                        : "—"}
                    </div>
                    <div>
                      <strong>शिक्षा:</strong>{" "}
                      {selectedRecordDetails.headEducation || "—"}
                    </div>
                    <div>
                      <strong>मोबाइल नंबर:</strong>{" "}
                      {selectedRecordDetails.mobileNumber || "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Parents Section */}
              <div
                style={{
                  background: "#FFF",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #E0E0E0",
                }}
              >
                <h4 style={{ color: "#7B1113", margin: "0 0 8px 0" }}>
                  2. माता-पिता की जानकारी
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    fontSize: "0.9rem",
                  }}
                >
                  <div>
                    <strong>पिता का नाम:</strong>{" "}
                    {selectedRecordDetails.fatherName || "—"}
                  </div>
                  <div>
                    <strong>पिता का गौत्र:</strong>{" "}
                    {selectedRecordDetails.fatherGotra || "—"}
                  </div>
                  <div>
                    <strong>माता का नाम:</strong>{" "}
                    {selectedRecordDetails.motherName || "—"}
                  </div>
                  <div>
                    <strong>माता का गौत्र:</strong>{" "}
                    {selectedRecordDetails.motherGotra || "—"}
                  </div>
                </div>
              </div>

              {/* Spouse Section */}
              <div
                style={{
                  background: "#FFF",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #E0E0E0",
                }}
              >
                <h4 style={{ color: "#7B1113", margin: "0 0 8px 0" }}>
                  3. पत्नी की जानकारी
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    fontSize: "0.9rem",
                  }}
                >
                  <div>
                    <strong>पत्नी का नाम:</strong>{" "}
                    {selectedRecordDetails.wifeName || "—"}
                  </div>
                  <div>
                    <strong>पत्नी का गौत्र:</strong>{" "}
                    {selectedRecordDetails.wifeVillage || "—"}
                  </div>
                  <div>
                    <strong>पत्नी की आयु:</strong>{" "}
                    {selectedRecordDetails.wifeAge
                      ? `${selectedRecordDetails.wifeAge} वर्ष`
                      : "—"}
                  </div>
                  <div>
                    <strong>पत्नी की शिक्षा:</strong>{" "}
                    {selectedRecordDetails.wifeEducation || "—"}
                  </div>
                </div>
              </div>

              {/* In-Laws Section */}
              <div
                style={{
                  background: "#FFF",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #E0E0E0",
                }}
              >
                <h4 style={{ color: "#7B1113", margin: "0 0 8px 0" }}>
                  4. ससुराल पक्ष की जानकारी
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    fontSize: "0.9rem",
                  }}
                >
                  <div>
                    <strong>ससुर जी का नाम:</strong>{" "}
                    {selectedRecordDetails.fatherInLawName || "—"}
                  </div>
                  <div>
                    <strong>ससुर जी का गौत्र:</strong>{" "}
                    {selectedRecordDetails.fatherInLawVillage || "—"}
                  </div>
                  <div>
                    <strong>सासू जी का नाम:</strong>{" "}
                    {selectedRecordDetails.motherInLawName || "—"}
                  </div>
                  <div>
                    <strong>सासू जी का गौत्र:</strong>{" "}
                    {selectedRecordDetails.motherInLawVillage || "—"}
                  </div>
                </div>
              </div>

              {/* Address & Occupation Section */}
              <div
                style={{
                  background: "#FFF",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #E0E0E0",
                }}
              >
                <h4 style={{ color: "#7B1113", margin: "0 0 8px 0" }}>
                  5. निवास व व्यवसाय का विवरण
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    fontSize: "0.9rem",
                    marginBottom: "8px",
                  }}
                >
                  <div>
                    <strong>व्यवसाय 1:</strong>{" "}
                    {selectedRecordDetails.occupation1 || "—"}
                  </div>
                  <div>
                    <strong>व्यवसाय 2:</strong>{" "}
                    {selectedRecordDetails.occupation2 || "—"}
                  </div>
                </div>
                <div style={{ fontSize: "0.9rem", marginBottom: "4px" }}>
                  <strong>वर्तमान निवास स्थान:</strong>{" "}
                  {selectedRecordDetails.currentAddress || "—"}
                </div>
                <div style={{ fontSize: "0.9rem" }}>
                  <strong>स्थाई निवास स्थान:</strong>{" "}
                  {selectedRecordDetails.permanentAddress || "—"}
                </div>
              </div>

              {/* Signature & Other Details */}
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <div
                  style={{
                    flex: 1,
                    background: "#FFF",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #E0E0E0",
                  }}
                >
                  <h4 style={{ color: "#7B1113", margin: "0 0 8px 0" }}>
                    6. अन्य विवरण
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#444" }}>
                    {selectedRecordDetails.otherDetails || "कोई विवरण नहीं"}
                  </p>
                </div>

                <div
                  style={{
                    width: "200px",
                    background: "#FFF",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #E0E0E0",
                    textAlign: "center",
                  }}
                >
                  <h4
                    style={{
                      color: "#7B1113",
                      margin: "0 0 8px 0",
                      fontSize: "0.9rem",
                    }}
                  >
                    7. मुखिया के हस्ताक्षर
                  </h4>
                  <div
                    style={{
                      height: "60px",
                      border: "1px dashed #8B0000",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selectedRecordDetails.signatureUrl ? (
                      <img
                        src={selectedRecordDetails.signatureUrl}
                        alt="Signature"
                        style={{ maxHeight: "100%", maxWidth: "100%" }}
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "#aaa" }}>
                        हस्ताक्षर नहीं है
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Family Members Table */}
              <div
                style={{
                  background: "#FFF",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #E0E0E0",
                }}
              >
                <h4 style={{ color: "#7B1113", margin: "0 0 8px 0" }}>
                  8. पारिवारिक सदस्यों की सूची (
                  {selectedRecordDetails.members
                    ? selectedRecordDetails.members.filter((m) => m.name).length
                    : 0}
                  )
                </h4>
                {selectedRecordDetails.members &&
                selectedRecordDetails.members.filter((m) => m.name).length >
                  0 ? (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.88rem",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#7B1113", color: "#FFF" }}>
                        <th
                          style={{ padding: "6px", border: "1px solid #DDD" }}
                        >
                          #
                        </th>
                        <th
                          style={{ padding: "6px", border: "1px solid #DDD" }}
                        >
                          सदस्य का नाम
                        </th>
                        <th
                          style={{ padding: "6px", border: "1px solid #DDD" }}
                        >
                          संबंध
                        </th>
                        <th
                          style={{ padding: "6px", border: "1px solid #DDD" }}
                        >
                          आयु
                        </th>
                        <th
                          style={{ padding: "6px", border: "1px solid #DDD" }}
                        >
                          शिक्षा
                        </th>
                        <th
                          style={{ padding: "6px", border: "1px solid #DDD" }}
                        >
                          व्यवसाय
                        </th>
                        <th
                          style={{ padding: "6px", border: "1px solid #DDD" }}
                        >
                          वैवाहिक स्थिति
                        </th>
                        <th
                          style={{ padding: "6px", border: "1px solid #DDD" }}
                        >
                          मोबाइल नंबर
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecordDetails.members
                        .filter((m) => m.name)
                        .map((m, idx) => (
                          <tr
                            key={idx}
                            style={{
                              background: idx % 2 === 0 ? "#FFF" : "#F9F9F9",
                            }}
                          >
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid #DDD",
                                textAlign: "center",
                              }}
                            >
                              {idx + 1}
                            </td>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid #DDD",
                              }}
                            >
                              {m.name}
                            </td>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid #DDD",
                              }}
                            >
                              {m.relation || "—"}
                            </td>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid #DDD",
                                textAlign: "center",
                              }}
                            >
                              {m.age || "—"}
                            </td>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid #DDD",
                              }}
                            >
                              {m.education || "—"}
                            </td>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid #DDD",
                              }}
                            >
                              {m.occupation || "—"}
                            </td>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid #DDD",
                              }}
                            >
                              {m.maritalStatus || "—"}
                            </td>
                            <td
                              style={{
                                padding: "6px",
                                border: "1px solid #DDD",
                              }}
                            >
                              {m.mobile || "—"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ color: "#888", fontSize: "0.88rem" }}>
                    कोई पारिवारिक सदस्य दर्ज नहीं है।
                  </div>
                )}
              </div>
            </div>

            {/* Modal Close Footer */}
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedRecordDetails(null)}
                style={{ color: "#333", padding: "8px 20px" }}
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
