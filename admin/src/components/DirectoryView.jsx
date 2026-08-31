import React from "react";
import DirectoryCard from "./DirectoryCard";
import { Printer } from "lucide-react";

export default function DirectoryView({ records = [] }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
        className="no-print"
      >
        <h2>डायरेक्टरी कार्ड्स सूची ({records.length})</h2>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={18} /> सभी कार्ड प्रिंट करें
        </button>
      </div>

      {records.map((rec) => (
        <DirectoryCard key={rec.registrationId} record={rec} />
      ))}
    </div>
  );
}
