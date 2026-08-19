import React, { useState, useEffect } from 'react';
import { Search, Eye, Edit, Trash2, Printer, Plus, RefreshCw } from 'lucide-react';

export default function AdminRecords({ onViewRecord, onEditRecord, onCreateNew }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/records');
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
    if (!window.confirm(`क्या आप रजिस्ट्रेशन क्रमांक ${id} को हटाना चाहते हैं?`)) return;

    try {
      const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchRecords();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('हटाने में विफलता');
    }
  };

  const filteredRecords = records.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
      (r.registrationId && r.registrationId.toLowerCase().includes(term)) ||
      (r.headName && r.headName.toLowerCase().includes(term)) ||
      (r.mobileNumber && r.mobileNumber.toLowerCase().includes(term)) ||
      (r.headVillage && r.headVillage.toLowerCase().includes(term))
    );
  });

  return (
    <div className="admin-container no-print">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: '#7B1113' }}>पंजीकृत रिकॉर्ड प्रबंधन (Admin Records)</h2>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>कुल प्रविष्टियाँ: {records.length}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" style={{ color: '#333' }} onClick={fetchRecords}>
            <RefreshCw size={16} /> रिफ्रेश
          </button>
          <button className="btn btn-primary" onClick={onCreateNew}>
            <Plus size={16} /> नया फॉर्म भरें
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="search-bar-row">
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#888' }} />
          <input 
            type="text" 
            className="search-input"
            style={{ paddingLeft: '38px' }}
            placeholder="मुखिया का नाम, मोबाइल नंबर, गौत्र या Registration ID से खोजें..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Records Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>डेटा लोड हो रहा है...</div>
      ) : filteredRecords.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px' }}>
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
              <th>दिनांक</th>
              <th style={{ textAlign: 'center' }}>कार्रवाई (Actions)</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map(rec => (
              <tr key={rec.registrationId}>
                <td><strong>{rec.registrationId}</strong></td>
                <td>{rec.headName || '—'}</td>
                <td>{rec.headVillage || '—'}</td>
                <td>{rec.mobileNumber || '—'}</td>
                <td>{rec.members ? rec.members.filter(m => m.name).length : 0}</td>
                <td>{rec.submissionDate || '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', color: '#0288d1' }}
                      onClick={() => onViewRecord(rec)}
                      title="देखें और प्रिंट करें"
                    >
                      <Printer size={15} />
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', color: '#ed6c02' }}
                      onClick={() => onEditRecord(rec)}
                      title="संपादित करें"
                    >
                      <Edit size={15} />
                    </button>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '4px 8px' }}
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
