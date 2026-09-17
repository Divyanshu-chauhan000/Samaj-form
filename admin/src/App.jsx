import React, { useState } from "react";
import AdminRecords from "./components/AdminRecords";
import DirectoryView from "./components/DirectoryView";
import DirectoryCard from "./components/DirectoryCard";
import { BookOpen, ArrowLeft, Download } from "lucide-react";
import { API_BASE_URL } from "./config.js";

export default function App() {
  const [view, setView] = useState("records"); // 'records' | 'card' | 'all-cards'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [allRecords, setAllRecords] = useState([]);

  const handleViewDirectoryCard = (record) => {
    setSelectedRecord(record);
    setView("card");
  };

  const handleViewAllDirectoryCards = (records) => {
    setAllRecords(records);
    setView("all-cards");
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="app-header no-print">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div
            className="app-title"
            style={{ cursor: "pointer" }}
            onClick={() => setView("records")}
          >
            <BookOpen size={26} style={{ color: "#c59b27" }} />
            <span>कुमावत समाज एडमिन पोर्टल (Admin Panel)</span>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            {view !== "records" && (
              <button
                className="btn btn-secondary"
                onClick={() => setView("records")}
                style={{ color: "#FFF" }}
              >
                <ArrowLeft size={18} /> वापस रिकॉर्ड्स सूची में जाएं
              </button>
            )}
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
              <Download size={18} /> एक्सेल एक्सपोर्ट (A-Z Data CSV)
            </a>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="main-content" style={{ padding: "20px" }}>
        {view === "records" && (
          <AdminRecords
            onViewRecord={(rec) => {
              window.open(`http://localhost:3000`, "_blank");
            }}
            onEditRecord={(rec) => {
              window.open(`http://localhost:3000`, "_blank");
            }}
            onCreateNew={() => {
              window.open(`http://localhost:3000`, "_blank");
            }}
            onViewDirectoryCard={handleViewDirectoryCard}
            onViewAllDirectoryCards={handleViewAllDirectoryCards}
          />
        )}

        {view === "card" && selectedRecord && (
          <div>
            <div style={{ marginBottom: "16px" }} className="no-print">
              <button
                className="btn btn-secondary"
                onClick={() => setView("records")}
                style={{ color: "#333" }}
              >
                <ArrowLeft size={16} /> रिकॉर्ड्स पर वापस जाएँ
              </button>
            </div>
            <DirectoryCard record={selectedRecord} />
          </div>
        )}

        {view === "all-cards" && (
          <div>
            <div style={{ marginBottom: "16px" }} className="no-print">
              <button
                className="btn btn-secondary"
                onClick={() => setView("records")}
                style={{ color: "#333" }}
              >
                <ArrowLeft size={16} /> रिकॉर्ड्स पर वापस जाएँ
              </button>
            </div>
            <DirectoryView records={allRecords} />
          </div>
        )}
      </main>
    </div>
  );
}
