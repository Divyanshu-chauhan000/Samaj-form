import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Printer,
  Plus,
  RefreshCw,
} from "lucide-react";

const formatDate = (value) => {
  if (!value) return "—";
  const text = String(value).trim();
  const legacyMatch = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i
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
      Number(legacyMatch[6] || 0)
    );
  } else {
    date = new Date(text);
  }
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function AdminRecords({
  onViewRecord,
  onEditRecord,
  onCreateNew,
}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/records");
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
      const res = await fetch(`/api/records/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchRecords();
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
    const memberMatch = Array.isArray(r.members) && r.members.some(m => 
      (m.name && m.name.toLowerCase().includes(term)) ||
      (m.mobile && String(m.mobile).includes(term))
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
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.6rem", color: "#7B1113" }}>
            पंजीकृत रिकॉर्ड प्रबंधन (Admin Records)
          </h2>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>
            कुल प्रविष्टियाँ: {records.length}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn btn-secondary"
            style={{ color: "#333" }}
            onClick={fetchRecords}
          >
            <RefreshCw size={16} /> रिफ्रेश
          </button>
          <button className="btn btn-primary" onClick={onCreateNew}>
            <Plus size={16} /> नया फॉर्म भरें
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
              <th style={{ textAlign: "center" }}>कार्रवाई (Actions)</th>
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
                <td>{formatDate(rec.updatedAt || rec.createdAt || rec.submissionDate)}</td>
                <td style={{ textAlign: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "4px 8px", color: "#0288d1" }}
                      onClick={() => onViewRecord(rec)}
                      title="देखें और प्रिंट करें"
                    >
                      <Printer size={15} />
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: "4px 8px", color: "#ed6c02" }}
                      onClick={() => onEditRecord(rec)}
                      title="संपादित करें"
                    >
                      <Edit size={15} />
                    </button>
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
    </div>
  );
}
