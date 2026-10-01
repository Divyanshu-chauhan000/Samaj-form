import React from "react";
import { Printer } from "lucide-react";

export default function PustikaView({ records = [] }) {
  // Dynamically chunk records so they don't exceed A4 height.
  // An A4 page can fit roughly 42 "units" of height.
  // A card's header is ~6 units. Each member row is 1 unit.
  const MAX_PAGE_UNITS = 42;
  const chunkPages = [];
  let currentPage = [];
  let currentUnits = 0;

  records.forEach(rec => {
    const memberCount = rec.members ? rec.members.filter(m => m.name).length : 0;
    // ensure at least 1 unit if 0 members
    const rowUnits = Math.max(memberCount, 1);
    const cardUnits = 6 + rowUnits + 1; // +1 for table header

    if (currentUnits + cardUnits > MAX_PAGE_UNITS && currentPage.length > 0) {
      chunkPages.push(currentPage);
      currentPage = [];
      currentUnits = 0;
    }
    
    currentPage.push(rec);
    currentUnits += cardUnits;
  });

  if (currentPage.length > 0) {
    chunkPages.push(currentPage);
  }
  
  if (chunkPages.length === 0) chunkPages.push([]);

  return (
    <div className="pustika-wrapper">
      <style>{`
        .pustika-wrapper {
          background: #f0f0f0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .pustika-page {
          width: 210mm;
          max-height: 297mm;
          box-shadow: 0 0 10px rgba(0,0,0,0.2);
          position: relative;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Arial', sans-serif;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .pustika-page-inner {
          border: 3px solid #8c2517;
          padding: 10px;
          box-sizing: border-box;
          background: #FAF3DF;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pustika-card {
          border: 2px solid #8c2517;
          background-color: #fcf8eb;
          display: flex;
          flex-direction: row;
          font-size: 0.75rem;
          color: #333;
          page-break-inside: avoid;
        }

        .pustika-card-left {
          flex: 2.8;
          display: flex;
          flex-direction: column;
        }

        .pustika-card-top-left {
          display: flex;
          border-bottom: 2px solid #8c2517;
          flex: 1;
        }

        .pustika-photo-container {
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pustika-photo-box {
          width: 80px;
          height: 100px;
          border: 1px solid #8c2517;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          position: relative;
        }

        .pustika-photo-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pustika-photo-box .placeholder-cross {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(to top left, transparent calc(50% - 0.5px), #8c2517, transparent calc(50% + 0.5px)),
                      linear-gradient(to top right, transparent calc(50% - 0.5px), #8c2517, transparent calc(50% + 0.5px));
        }

        .pustika-head-details {
          flex: 1;
          padding: 6px;
          line-height: 1.4;
        }

        .pustika-head-details h3 {
          margin: 0 0 6px 0;
          color: #8c2517;
          font-size: 0.95rem;
          font-weight: bold;
        }

        .pustika-grid-3col {
          display: grid;
          grid-template-columns: 1.2fr 1.5fr 1fr;
          gap: 1px 4px;
        }
        
        .lbl {
          font-weight: bold;
          color: #333;
          display: inline-block;
        }

        .pustika-address-box {
          flex: 1.2;
          display: flex;
          flex-direction: column;
          border-left: 2px solid #8c2517;
        }

        .addr-section {
          border-bottom: 2px solid #8c2517;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .addr-section:last-child {
          border-bottom: none;
        }

        .addr-title {
          color: #8c2517;
          font-weight: bold;
          font-size: 0.8rem;
          background-color: #E6D0A3;
          padding: 3px 6px;
          border-bottom: 1px solid #d4be8f;
        }
        
        .addr-content {
          padding: 4px 6px;
          flex: 1;
        }

        .pustika-members-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          table-layout: fixed;
        }

        .pustika-members-table th {
          background-color: #8c2517;
          color: white;
          padding: 3px 4px;
          border-right: 1px solid #fff;
          font-size: 0.7rem;
        }
        .pustika-members-table th:last-child {
          border-right: none;
        }

        .pustika-members-table td {
          padding: 3px 4px;
          border-right: 1px solid #8c2517;
          border-bottom: 1px solid #8c2517;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pustika-members-table td:last-child {
          border-right: none;
        }

        .pustika-members-table tr:last-child td {
          border-bottom: none;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .pustika-wrapper, .pustika-wrapper * {
            visibility: visible;
          }
          .pustika-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            padding: 0;
            background: none;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .pustika-page {
            box-shadow: none;
            margin: 0;
            border: none;
          }
          @page {
            size: A4;
            margin: 0mm;
          }
        }
      `}</style>

      <div
        className="no-print"
        style={{
          width: "210mm",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "white",
          padding: "15px",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ margin: 0, color: "#8B0000" }}>
          परिचय पुस्तिका प्रिंट प्रीव्यू ({records.length} रिकॉर्ड्स)
        </h2>
        <button
          className="btn btn-primary"
          style={{ backgroundColor: "#8B0000", borderColor: "#8B0000", color: "white", padding: "8px 16px", borderRadius: "5px" }}
          onClick={() => window.print()}
        >
          <Printer size={18} /> पुस्तिका प्रिंट करें
        </button>
      </div>

      {chunkPages.map((pageRecords, pageIdx) => (
        <div key={pageIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="no-print" style={{ marginBottom: "10px", textAlign: "right", width: "210mm" }}>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: "0.8rem", padding: "6px 12px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
              onClick={() => {
                // simple hack to print specific page: hide others
                const allPages = document.querySelectorAll('.pustika-page');
                allPages.forEach((el, i) => {
                  if(i !== pageIdx) el.style.display = 'none';
                });
                window.print();
                // restore
                allPages.forEach(el => el.style.display = 'flex');
              }}
            >
              <Printer size={14} /> केवल यह पेज प्रिंट करें (Page {pageIdx + 1})
            </button>
          </div>
          <div className="pustika-page">
            <div className="pustika-page-inner">
              {pageRecords.map((rec, rIdx) => (
              <div key={rIdx} className="pustika-card">
                {/* Left Side */}
                <div className="pustika-card-left">
                  <div className="pustika-card-top-left">
                    {/* Photo */}
                    <div className="pustika-photo-container">
                      <div className="pustika-photo-box">
                        {rec.photoUrl ? (
                          <img src={rec.photoUrl} alt="Photo" crossOrigin="anonymous" />
                        ) : (
                          <div className="placeholder-cross"></div>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="pustika-head-details">
                      <h3>मुखिया का नाम - {rec.headName || "—"}</h3>
                      <div className="pustika-grid-3col">
                        <div><span className="lbl">आयु</span> : {rec.headAge ? `${rec.headAge}वर्ष` : "—"}</div>
                        <div><span className="lbl">पिता</span> : {rec.fatherName || "—"}</div>
                        <div><span className="lbl">गौत्र</span> : {rec.fatherGotra || rec.headVillage || "—"}</div>

                        <div><span className="lbl">शिक्षा</span> : {rec.headEducation || "—"}</div>
                        <div><span className="lbl">माता</span> : {rec.motherName || "—"}</div>
                        <div><span className="lbl">गौत्र</span> : {rec.motherGotra || "—"}</div>

                        <div><span className="lbl">गौत्र</span> : {rec.headVillage || "—"}</div>
                        <div><span className="lbl">पत्नि</span> : {rec.wifeName || "—"}</div>
                        <div><span className="lbl">गौत्र</span> : {rec.wifeVillage || "—"}</div>

                        <div><span className="lbl">मोबा</span> : {rec.mobileNumber || "—"}</div>
                        <div><span className="lbl">ससुरजी</span> : {rec.fatherInLawName || "—"}</div>
                        <div><span className="lbl">गौत्र</span> : {rec.fatherInLawVillage || "—"}</div>

                        <div></div>
                        <div><span className="lbl">सासूजी</span> : {rec.motherInLawName || "—"}</div>
                        <div><span className="lbl">गौत्र</span> : {rec.motherInLawVillage || "—"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Family Members Table */}
                  <table className="pustika-members-table">
                    <thead>
                      <tr>
                        <th style={{ width: "25px", textAlign: "center" }}>क्रम</th>
                        <th>नाम</th>
                        <th style={{ width: "30px", textAlign: "center" }}>आयु</th>
                        <th style={{ width: "45px" }}>सम्बंध</th>
                        <th>शिक्षा</th>
                        <th>व्यवसाय</th>
                        <th style={{ width: "55px" }}>विवा/अविवा</th>
                        <th style={{ width: "65px" }}>मोबाईल</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rec.members && rec.members.filter(m => m.name).map((m, mIdx) => (
                        <tr key={mIdx}>
                          <td style={{ textAlign: "center", fontWeight: "bold" }}>{mIdx + 1}</td>
                          <td>{m.name}</td>
                          <td style={{ textAlign: "center" }}>{m.age || "—"}</td>
                          <td>{m.relation || "—"}</td>
                          <td>{m.education || "—"}</td>
                          <td style={{ textAlign: "center" }}>{m.occupation || "-"}</td>
                          <td>{m.maritalStatus || "—"}</td>
                          <td>{m.mobile || "—"}</td>
                        </tr>
                      ))}
                      {/* Fill empty rows if less than 2 members to keep height roughly consistent */}
                      {(!rec.members || rec.members.filter(m => m.name).length === 0) && (
                        <tr><td colSpan="8" style={{ textAlign: "center" }}>कोई सदस्य नहीं</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Right Side */}
                <div className="pustika-address-box">
                  <div className="addr-section">
                    <div className="addr-title">मूल निवास</div>
                    <div className="addr-content">{rec.permanentAddress || "—"}</div>
                  </div>
                  <div className="addr-section">
                    <div className="addr-title">वर्तमान निवास</div>
                    <div className="addr-content">{rec.currentAddress || "—"}</div>
                  </div>
                  <div className="addr-section">
                    <div className="addr-title">व्यवसाय</div>
                    <div className="addr-content">
                      <div>{rec.occupation1 || "—"}</div>
                      <div>{rec.occupation2 || ""}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      ))}
    </div>
  );
}
