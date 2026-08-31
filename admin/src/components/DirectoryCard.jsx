import React from "react";
import "./DirectoryCard.css";
import { User, Printer } from "lucide-react";

export default function DirectoryCard({ record }) {
  if (!record) return null;

  return (
    <div className="directory-card">
      <div className="directory-card-header">
        <div>
          <div className="directory-card-title">कुमावत समाज परिचय कार्ड</div>
          <div style={{ fontSize: "0.85rem", color: "#666" }}>
            पंजीयन सं: <strong>{record.registrationId}</strong> | तारीख: {record.submissionDate || "—"}
          </div>
        </div>
        <button
          className="btn btn-secondary no-print"
          onClick={() => window.print()}
          style={{ color: "#333" }}
        >
          <Printer size={16} /> प्रिंट (Print)
        </button>
      </div>

      <div className="directory-card-body">
        <div className="directory-photo-area">
          {record.photoUrl ? (
            <img
              src={record.photoUrl}
              alt={record.headName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              crossOrigin="anonymous"
            />
          ) : (
            <User size={48} color="#888" />
          )}
        </div>

        <div className="directory-info-area">
          <h3 style={{ color: "#7B1113", margin: "0 0 6px 0" }}>{record.headName || "—"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "0.9rem" }}>
            <div><strong>गौत्र:</strong> {record.headVillage || "—"}</div>
            <div><strong>आयु:</strong> {record.headAge || "—"} वर्ष</div>
            <div><strong>पिता का नाम:</strong> {record.fatherName || "—"}</div>
            <div><strong>मोबाइल:</strong> {record.mobileNumber || "—"}</div>
            <div><strong>व्यवसाय:</strong> {record.occupation1 || "—"}</div>
            <div><strong>शिक्षा:</strong> {record.headEducation || "—"}</div>
          </div>
          <div style={{ marginTop: "6px", fontSize: "0.88rem" }}>
            <strong>वर्तमान पता:</strong> {record.currentAddress || "—"}
          </div>
        </div>
      </div>

      {record.members && record.members.filter((m) => m.name).length > 0 && (
        <table className="directory-table">
          <thead>
            <tr>
              <th>#</th>
              <th>सदस्य का नाम</th>
              <th>संबंध</th>
              <th>आयु</th>
              <th>शिक्षा</th>
              <th>व्यवसाय</th>
              <th>मोबाइल</th>
            </tr>
          </thead>
          <tbody>
            {record.members
              .filter((m) => m.name)
              .map((m, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{m.name}</td>
                  <td>{m.relation || "—"}</td>
                  <td>{m.age || "—"}</td>
                  <td>{m.education || "—"}</td>
                  <td>{m.occupation || "—"}</td>
                  <td>{m.mobile || "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
