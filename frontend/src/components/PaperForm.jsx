import React, { useState, useRef } from 'react';
import { Upload, Plus, Trash2, Save, Printer, ArrowLeft, CheckCircle, FileText, Search, Camera, X } from 'lucide-react';

const INITIAL_MEMBERS = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  name: '',
  age: '',
  relation: '',
  education: '',
  occupation: '',
  maritalStatus: '',
  mobile: ''
}));

export default function PaperForm({ initialData = null, onSaved = null, onCancel = null }) {
  const fileInputRef = useRef(null);
  const sigInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);

  const [searchRegId, setSearchRegId] = useState('');
  const [searching, setSearching] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  
  const getInitialState = (data) => ({
    registrationId: data?.registrationId || '',
    isEdit: !!(data && data.registrationId),
    headName: data?.headName || '',
    headAge: data?.headAge || '',
    headEducation: data?.headEducation || '',
    fatherName: data?.fatherName || '',
    motherName: data?.motherName || '',
    wifeName: data?.wifeName || '',
    wifeAge: data?.wifeAge || '',
    wifeEducation: data?.wifeEducation || '',
    wifeVillage: data?.wifeVillage || '',
    fatherInLawName: data?.fatherInLawName || '',
    fatherInLawVillage: data?.fatherInLawVillage || '',
    motherInLawName: data?.motherInLawName || '',
    motherInLawVillage: data?.motherInLawVillage || '',
    headVillage: data?.headVillage || '',
    mobileNumber: data?.mobileNumber || '',
    currentAddress: data?.currentAddress || '',
    permanentAddress: data?.permanentAddress || '',
    occupation1: data?.occupation1 || '',
    occupation2: data?.occupation2 || '',
    photoUrl: data?.photoUrl || '',
    signatureUrl: data?.signatureUrl || '',
    otherDetails: data?.otherDetails || '',
    members: data?.members || INITIAL_MEMBERS
  });

  const [formData, setFormData] = useState(() => getInitialState(initialData));

  const handleResetNewForm = () => {
    setFormData({
      registrationId: '',
      isEdit: false,
      headName: '',
      headAge: '',
      headEducation: '',
      fatherName: '',
      motherName: '',
      wifeName: '',
      wifeAge: '',
      wifeEducation: '',
      wifeVillage: '',
      fatherInLawName: '',
      fatherInLawVillage: '',
      motherInLawName: '',
      motherInLawVillage: '',
      headVillage: '',
      mobileNumber: '',
      currentAddress: '',
      permanentAddress: '',
      occupation1: '',
      occupation2: '',
      photoUrl: '',
      signatureUrl: '',
      otherDetails: '',
      members: Array.from({ length: 7 }, (_, i) => ({
        id: i + 1,
        name: '',
        age: '',
        relation: '',
        education: '',
        occupation: '',
        maritalStatus: '',
        mobile: ''
      }))
    });
    setSuccessInfo(null);
    setErrors({});
    setSearchRegId('');
  };

  const handleSearchAndLoadRecord = async () => {
    if (!searchRegId.trim()) {
      alert('कृपया Registration ID दर्ज करें। (उदा: KSP-2026-00010 या 10)');
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/records/${encodeURIComponent(searchRegId.trim())}`);
      const data = await res.json();
      if (data.success && data.record) {
        const rec = data.record;
        setFormData({
          registrationId: rec.registrationId,
          isEdit: true,
          headName: rec.headName || '',
          headAge: rec.headAge || '',
          headEducation: rec.headEducation || '',
          fatherName: rec.fatherName || '',
          motherName: rec.motherName || '',
          wifeName: rec.wifeName || '',
          wifeAge: rec.wifeAge || '',
          wifeEducation: rec.wifeEducation || '',
          wifeVillage: rec.wifeVillage || '',
          fatherInLawName: rec.fatherInLawName || '',
          fatherInLawVillage: rec.fatherInLawVillage || '',
          motherInLawName: rec.motherInLawName || '',
          motherInLawVillage: rec.motherInLawVillage || '',
          headVillage: rec.headVillage || '',
          mobileNumber: rec.mobileNumber || '',
          currentAddress: rec.currentAddress || '',
          permanentAddress: rec.permanentAddress || '',
          occupation1: rec.occupation1 || '',
          occupation2: rec.occupation2 || '',
          photoUrl: rec.photoUrl || '',
          signatureUrl: rec.signatureUrl || '',
          otherDetails: rec.otherDetails || '',
          members: rec.members && rec.members.length > 0 ? rec.members : INITIAL_MEMBERS
        });
        setSuccessInfo(null);
        alert(`✓ पंजीयन क्रमांक ${rec.registrationId} का विवरण सफलतापूर्वक लोड हो गया है। आप बदलाव करके फॉर्म सबमिट कर सकते हैं।`);
      } else {
        alert(data.message || 'कोई रिकॉर्ड नहीं मिला');
      }
    } catch (err) {
      console.error(err);
      alert('फॉर्म विवरण लोड करने में विफलता');
    } finally {
      setSearching(false);
    }
  };

  const [uploading, setUploading] = useState(false);
  const [sigUploading, setSigUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successInfo, setSuccessInfo] = useState(null);

  // Input Change Handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...formData.members];
    updatedMembers[index][field] = value;
    setFormData(prev => ({ ...prev, members: updatedMembers }));
  };

  const handleAddMember = () => {
    setFormData(prev => ({
      ...prev,
      members: [
        ...prev.members,
        {
          id: prev.members.length + 1,
          name: '',
          age: '',
          relation: '',
          education: '',
          occupation: '',
          maritalStatus: '',
          mobile: ''
        }
      ]
    }));
  };

  const handleRemoveMember = (index) => {
    if (formData.members.length <= 1) return;
    const updated = formData.members.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, members: updated }));
  };

  // Photo Upload Handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('photo', file);

    setUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (result.success) {
        setFormData(prev => ({ ...prev, photoUrl: result.photoUrl }));
      } else {
        alert('फोटो अपलोड करने में विफलता: ' + result.message);
      }
    } catch (err) {
      console.error(err);
      alert('फोटो अपलोड नहीं हो सका। कृपया पुनः प्रयास करें।');
    } finally {
      setUploading(false);
    }
  };

  // Camera capture handlers
  const startCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Live webcam access error, opening fallback mobile camera input:', err);
      setShowCameraModal(false);
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhotoFromCamera = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `camera_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      
      const data = new FormData();
      data.append('photo', file);
      setUploading(true);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: data
        });
        const result = await res.json();
        if (result.success) {
          setFormData(prev => ({ ...prev, photoUrl: result.photoUrl }));
        } else {
          alert('फोटो अपलोड करने में विफलता: ' + result.message);
        }
      } catch (err) {
        console.error(err);
        alert('फोटो अपलोड नहीं हो सका।');
      } finally {
        setUploading(false);
      }
    }, 'image/jpeg', 0.9);
  };

  // Signature Upload Handler
  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('photo', file);

    setSigUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (result.success) {
        setFormData(prev => ({ ...prev, signatureUrl: result.photoUrl }));
      } else {
        alert('हस्ताक्षर अपलोड करने में विफलता: ' + result.message);
      }
    } catch (err) {
      console.error(err);
      alert('हस्ताक्षर अपलोड नहीं हो सका।');
    } finally {
      setSigUploading(false);
    }
  };

  // Basic Validation
  const validateForm = () => {
    const errs = {};
    if (!formData.headName.trim()) {
      errs.headName = 'कृपया मुखिया का नाम दर्ज करें।';
    }
    if (formData.mobileNumber && !/^[6-9]\d{9}$/.test(formData.mobileNumber.trim())) {
      errs.mobileNumber = 'कृपया सही 10-अंकीय मोबाइल नंबर दर्ज करें।';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('कृपया फॉर्म में लाल रंग से दर्शाई गई त्रुटियों को ठीक करें।');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();

      if (result.success) {
        setSuccessInfo(result);
        setFormData(prev => ({ ...prev, registrationId: result.registrationId, isEdit: true }));
        if (onSaved) onSaved(result.record);
      } else {
        alert(result.message || 'रिकॉर्ड सेव नहीं हो पाया। कृपया दोबारा प्रयास करें।');
      }
    } catch (err) {
      console.error(err);
      alert('सर्वर से संपर्क नहीं हो सका। कृपया इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।');
    } finally {
      setSaving(false);
    }
  };

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="form-page-container">
      {/* Top Banner Status after Submit */}
      {successInfo && (
        <div className="no-print" style={{
          maxWidth: '210mm',
          margin: '0 auto 20px auto',
          background: '#e8f5e9',
          border: '1px solid #c8e6c9',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
        }}>
          <div style={{ color: '#2e7d32', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <CheckCircle size={24} />
            {successInfo.message}
          </div>
          <p style={{ marginTop: '6px', fontSize: '1rem', color: '#1b5e20' }}>
            आपका पंजीयन क्रमांक (Registration ID): <strong>{successInfo.registrationId}</strong>
          </p>
          {successInfo.googleSheetSaved ? (
            <p style={{ color: '#388e3c', fontSize: '0.85rem', marginTop: '4px' }}>
              ✓ डेटा Google Sheets में सफलतापूर्वक अपडेट हो गया है।
            </p>
          ) : (
            <p style={{ color: '#f57c00', fontSize: '0.85rem', marginTop: '4px' }}>
              ℹ डेटा लोकल डेटाबेस में सुरक्षित है (गूगल शीट सिंक बैकग्राउंड में चालू है)।
            </p>
          )}

          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={16} /> फॉर्म प्रिंट / PDF डाउनलोड करें
            </button>
            <button className="btn btn-secondary" style={{ color: '#333' }} onClick={() => setSuccessInfo(null)}>
              इसी फॉर्म में सुधार करें
            </button>
            <button className="btn btn-success" onClick={handleResetNewForm}>
              <Plus size={16} /> नया फॉर्म भरें (New Registration)
            </button>
          </div>
        </div>
      )}

      {/* Search & Edit Existing Form Bar */}
      <div className="no-print" style={{
        maxWidth: '210mm',
        margin: '0 auto 20px auto',
        background: '#fff8e1',
        border: '1px solid #ffe082',
        borderRadius: '8px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#795548', fontWeight: 'bold', fontSize: '0.95rem' }}>
          <Search size={18} style={{ color: '#d84315' }} />
          <span>पुराना फॉर्म एडिट करें:</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '260px' }}>
          <input 
            type="text" 
            placeholder="Registration ID दर्ज करें (उदा: KSP-2026-00010 या 10)" 
            value={searchRegId}
            onChange={e => setSearchRegId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchAndLoadRecord()}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button 
            type="button" 
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleSearchAndLoadRecord}
            disabled={searching}
          >
            <Search size={15} /> {searching ? 'खोज रहे हैं...' : 'विवरण लोड करें'}
          </button>
        </div>
      </div>

      {/* Main Printable Paper Form Frame */}
      <div className="paper-form-wrapper">
        <div className="paper-border-frame">

          {/* Form Header */}
          <div className="form-header">
            <h1 className="form-main-title">कुमावत समाज परिचय पुस्तिका फॉर्म, कर्नाटक-2026</h1>
            {formData.registrationId && (
              <div className="reg-badge">
                पंजीयन क्रमांक: {formData.registrationId}
              </div>
            )}
          </div>

          {/* Top Section: Rows 1-4 (Left) + Photo Box (Right) */}
          <div className="form-top-section">
            <div className="form-fields-grid">
              
              {/* Row 1: Head Name & Gautra */}
              <div className="form-row-2col">
                <div className="field-group">
                  <span className="field-label">मुखिया का नाम श्री -</span>
                  <div className="field-input-wrapper">
                    <input 
                      type="text" 
                      className="field-input"
                      value={formData.headName}
                      onChange={e => handleInputChange('headName', e.target.value)}
                      placeholder="मुखिया का नाम..."
                    />
                  </div>
                </div>
                <div className="field-group">
                  <span className="field-label">गौत्र -</span>
                  <div className="field-input-wrapper">
                    <input 
                      type="text" 
                      className="field-input"
                      value={formData.headVillage}
                      onChange={e => handleInputChange('headVillage', e.target.value)}
                      placeholder="गौत्र..."
                    />
                  </div>
                </div>
              </div>
              {errors.headName && <span style={{ color: 'red', fontSize: '8pt' }}>{errors.headName}</span>}

              {/* Row 2: Age, Education & Mobile */}
              <div className="form-row-2col">
                <div className="form-inline-group">
                  <span className="field-label label-nowrap">आयु -</span>
                  <div className="field-input-wrapper input-xs">
                    <input 
                      type="text" 
                      className="field-input"
                      value={formData.headAge}
                      onChange={e => handleInputChange('headAge', e.target.value)}
                    />
                  </div>
                  <span className="field-label label-nowrap">वर्ष, शिक्षा -</span>
                  <div className="field-input-wrapper input-md">
                    <input 
                      type="text" 
                      className="field-input"
                      value={formData.headEducation}
                      onChange={e => handleInputChange('headEducation', e.target.value)}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <span className="field-label">मोबाईल नं. -</span>
                  <div className="field-input-wrapper">
                    <input 
                      type="text" 
                      className="field-input"
                      value={formData.mobileNumber}
                      onChange={e => handleInputChange('mobileNumber', e.target.value)}
                      placeholder="10 अंकों का मोबाइल..."
                    />
                  </div>
                </div>
              </div>
              {errors.mobileNumber && <span style={{ color: 'red', fontSize: '8pt' }}>{errors.mobileNumber}</span>}

              {/* Row 3: Father Name & Gautra */}
              <div className="form-row-2col">
                <div className="field-group">
                  <span className="field-label">पिता का नाम श्री -</span>
                  <div className="field-input-wrapper">
                    <input 
                      type="text" 
                      className="field-input"
                      value={formData.fatherName}
                      onChange={e => handleInputChange('fatherName', e.target.value)}
                    />
                  </div>
                </div>
                <div className="field-group">
                  <span className="field-label">गौत्र -</span>
                  <div className="field-input-wrapper">
                    <input 
                      type="text" 
                      className="field-input"
                      value={formData.fatherGotra || ''}
                      onChange={e => handleInputChange('fatherGotra', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Mother Name & Gautra */}
              <div className="form-row-2col">
                <div className="field-group">
                  <span className="field-label">माता का नाम श्रीमती -</span>
                  <div className="field-input-wrapper">
                    <input 
                      type="text" 
                      className="field-input"
                      value={formData.motherName}
                      onChange={e => handleInputChange('motherName', e.target.value)}
                    />
                  </div>
                </div>
                <div className="field-group">
                  <span className="field-label">गौत्र -</span>
                  <div className="field-input-wrapper">
                    <input 
                      type="text" 
                      className="field-input"
                      value={formData.motherGotra || ''}
                      onChange={e => handleInputChange('motherGotra', e.target.value)}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Upper Right Head Photo Box */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="photo-box-container" style={{ cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="मुखिया फोटो" className="photo-preview-img" />
                ) : (
                  <div className="photo-box-label">
                    <Upload size={22} style={{ margin: '0 auto 4px auto', color: '#7B1113' }} />
                    <div>मुखिया की फोटो</div>
                    <div style={{ fontSize: '7.5pt', color: '#666', marginTop: '2px' }} className="no-print">
                      (अपलोड / फोटो खींचे)
                    </div>
                  </div>
                )}
              </div>

              {/* No-Print Action Buttons for Photo Upload & Camera */}
              <div className="no-print" style={{ marginTop: '8px', display: 'flex', gap: '6px', width: '100%', justifyContent: 'center' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 8px', fontSize: '8pt', color: '#333', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload size={13} /> {uploading ? 'अपलोड...' : 'फ़ाइल'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ padding: '4px 8px', fontSize: '8pt', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={startCamera}
                  disabled={uploading}
                >
                  <Camera size={13} /> कैमरा
                </button>
              </div>

              <input 
                type="file" 
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handlePhotoUpload}
              />
              <input 
                type="file" 
                ref={cameraInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                capture="user"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>

          {/* Full Width Section: Rows 5 to 10 (Below Photo Box) */}
          <div className="full-width-section">

            {/* Row 5: Wife Details */}
            <div className="form-row-2col">
              <div className="field-group">
                <span className="field-label">मुखिया की पत्नी का नाम श्रीमती -</span>
                <div className="field-input-wrapper">
                  <input 
                    type="text" 
                    className="field-input"
                    value={formData.wifeName}
                    onChange={e => handleInputChange('wifeName', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-inline-group">
                <span className="field-label label-nowrap">गौत्र -</span>
                <div className="field-input-wrapper input-sm">
                  <input 
                    type="text" 
                    className="field-input"
                    value={formData.wifeVillage}
                    onChange={e => handleInputChange('wifeVillage', e.target.value)}
                  />
                </div>
                <span className="field-label label-nowrap">आयु -</span>
                <div className="field-input-wrapper input-xs">
                  <input 
                    type="text" 
                    className="field-input"
                    value={formData.wifeAge}
                    onChange={e => handleInputChange('wifeAge', e.target.value)}
                  />
                </div>
                <span className="field-label label-nowrap">वर्ष, शिक्षा -</span>
                <div className="field-input-wrapper input-sm">
                  <input 
                    type="text" 
                    className="field-input"
                    value={formData.wifeEducation}
                    onChange={e => handleInputChange('wifeEducation', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Row 6: Father-in-law Name & Gautra */}
            <div className="form-row-2col">
              <div className="field-group">
                <span className="field-label">मुखिया के ससुर जी का नाम श्री -</span>
                <div className="field-input-wrapper">
                  <input 
                    type="text" 
                    className="field-input"
                    value={formData.fatherInLawName}
                    onChange={e => handleInputChange('fatherInLawName', e.target.value)}
                  />
                </div>
              </div>
              <div className="field-group">
                <span className="field-label">गौत्र -</span>
                <div className="field-input-wrapper">
                  <input 
                    type="text" 
                    className="field-input"
                    value={formData.fatherInLawVillage}
                    onChange={e => handleInputChange('fatherInLawVillage', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Row 7: Mother-in-law Name & Gautra */}
            <div className="form-row-2col">
              <div className="field-group">
                <span className="field-label">मुखिया के सासू जी का नाम श्रीमती -</span>
                <div className="field-input-wrapper">
                  <input 
                    type="text" 
                    className="field-input"
                    value={formData.motherInLawName}
                    onChange={e => handleInputChange('motherInLawName', e.target.value)}
                  />
                </div>
              </div>
              <div className="field-group">
                <span className="field-label">गौत्र -</span>
                <div className="field-input-wrapper">
                  <input 
                    type="text" 
                    className="field-input"
                    value={formData.motherInLawVillage}
                    onChange={e => handleInputChange('motherInLawVillage', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Row 8: Current Address */}
            <div className="field-group">
              <span className="field-label">वर्तमान निवास स्थान -</span>
              <div className="field-input-wrapper">
                <input 
                  type="text" 
                  className="field-input"
                  value={formData.currentAddress}
                  onChange={e => handleInputChange('currentAddress', e.target.value)}
                />
              </div>
            </div>

            {/* Row 9: Permanent Address */}
            <div className="field-group">
              <span className="field-label">स्थाई निवास -</span>
              <div className="field-input-wrapper">
                <input 
                  type="text" 
                  className="field-input"
                  value={formData.permanentAddress}
                  onChange={e => handleInputChange('permanentAddress', e.target.value)}
                />
              </div>
            </div>

            {/* Row 10: Occupation 1 & 2 */}
            <div className="occupation-wrapper">
              <span className="field-label label-nowrap" style={{ paddingTop: '3px' }}>व्यवसाय –</span>
              <div className="occupation-inputs-col">
                <div className="occupation-line">
                  <span className="field-label label-nowrap">1-</span>
                  <div className="field-input-wrapper">
                    <input 
                      type="text" 
                      className="field-input"
                      value={formData.occupation1}
                      onChange={e => handleInputChange('occupation1', e.target.value)}
                    />
                  </div>
                </div>
                <div className="occupation-line">
                  <span className="field-label label-nowrap">2-</span>
                  <div className="field-input-wrapper">
                    <input 
                      type="text" 
                      className="field-input"
                      value={formData.occupation2}
                      onChange={e => handleInputChange('occupation2', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Family Members Section */}
          <div className="section-title-box">
            परिवार के सदस्यों का विवरण
          </div>

          <div className="family-table-wrapper">
            <table className="family-table">
              <thead>
                <tr>
                  <th style={{ width: '6%' }}>क्र.सं.</th>
                  <th style={{ width: '22%' }}>नाम</th>
                  <th style={{ width: '8%' }}>आयु</th>
                  <th style={{ width: '15%' }}>मुखिया से सम्बन्ध</th>
                  <th style={{ width: '13%' }}>शिक्षा</th>
                  <th style={{ width: '13%' }}>व्यवसाय</th>
                  <th style={{ width: '11%' }}>विवाहित/अविवाहित</th>
                  <th style={{ width: '12%' }}>मोबाइल नंबर</th>
                  {formData.members.length > 7 && <th className="no-print no-print-action" style={{ width: '4%' }}></th>}
                </tr>
              </thead>
              <tbody>
                {formData.members.map((member, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <input 
                        type="text" 
                        value={member.name}
                        onChange={e => handleMemberChange(index, 'name', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={member.age}
                        onChange={e => handleMemberChange(index, 'age', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={member.relation}
                        onChange={e => handleMemberChange(index, 'relation', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={member.education}
                        onChange={e => handleMemberChange(index, 'education', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={member.occupation}
                        onChange={e => handleMemberChange(index, 'occupation', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={member.maritalStatus}
                        onChange={e => handleMemberChange(index, 'maritalStatus', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={member.mobile}
                        onChange={e => handleMemberChange(index, 'mobile', e.target.value)}
                      />
                    </td>
                    {formData.members.length > 7 && (
                      <td className="no-print no-print-action">
                        <button 
                          type="button" 
                          style={{ border: 'none', background: 'transparent', color: 'red', cursor: 'pointer' }}
                          onClick={() => handleRemoveMember(index)}
                          title="सदस्य हटाएं"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Dynamic Member Button */}
          <div className="add-member-btn-row no-print">
            <button type="button" className="btn btn-secondary" style={{ color: '#7B1113', borderColor: '#7B1113' }} onClick={handleAddMember}>
              <Plus size={16} /> + परिवार का सदस्य जोड़ें
            </button>
          </div>

          {/* Other Details Section */}
          <div className="other-details-box" style={{ marginTop: '10px' }}>
            <div className="other-details-label" style={{ fontWeight: 'bold', fontSize: '10pt' }}>
              अन्य विवरण जो आप पुस्तक में प्रकाशन करवाना चाहते हैं, उसे लिख देवें:
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
              <span className="field-label">1-</span>
              <div className="field-input-wrapper">
                <input 
                  type="text" 
                  className="field-input"
                  value={formData.otherDetails}
                  onChange={e => handleInputChange('otherDetails', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="notes-section" style={{ marginTop: '10px', fontSize: '9.5pt', lineHeight: '1.4' }}>
            <div className="notes-title" style={{ fontWeight: 'bold' }}>नोट:</div>
            <ol style={{ paddingLeft: '20px', margin: '2px 0' }}>
              <li>उपरोक्त फॉर्म निःशुल्क है।</li>
              <li>उपरोक्त फॉर्म में लिखित प्रकाशन निःशुल्क है।</li>
              <li>अन्य किसी भी प्रकार की प्रकाशन हेतु सूचना के लिये आप व्हाट्सएप नं. <strong>9414227607</strong> पर सम्पर्क कर सकते हैं।</li>
            </ol>
          </div>

          {/* Bottom Right Signature Box */}
          <div className="signature-section" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <div className="signature-box" style={{ textAlign: 'center', minWidth: '160px' }}>
              <div 
                className="signature-line-area"
                onClick={() => sigInputRef.current?.click()}
                style={{ borderBottom: '1px solid #333', minHeight: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                title="हस्ताक्षर अपलोड करने के लिए क्लिक करें"
              >
                {formData.signatureUrl ? (
                  <img 
                    src={formData.signatureUrl} 
                    alt="मुखिया के हस्ताक्षर" 
                    style={{ maxHeight: '38px', maxWidth: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ fontSize: '8pt', color: '#888' }} className="no-print">
                    (हस्ताक्षर अपलोड करें)
                  </div>
                )}
                <input 
                  type="file" 
                  ref={sigInputRef} 
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleSignatureUpload}
                />
              </div>
              <div className="signature-label" style={{ fontWeight: 'bold', marginTop: '4px', fontSize: '10.5pt' }}>
                मुखिया के हस्ताक्षर
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Screen Action Control Bar */}
      <div className="form-actions-bar no-print">
        {onCancel && (
          <button type="button" className="btn btn-secondary" style={{ color: '#333' }} onClick={onCancel}>
            <ArrowLeft size={16} /> वापस जाएँ
          </button>
        )}
        <button 
          type="button" 
          className="btn btn-success"
          onClick={handleSubmit}
          disabled={saving}
        >
          <Save size={18} /> {saving ? 'सहेजा जा रहा है...' : 'फॉर्म सबमिट करें (Save)'}
        </button>
        <button 
          type="button" 
          className="btn btn-secondary"
          style={{ color: '#555' }}
          onClick={handleResetNewForm}
        >
          <Plus size={16} /> रिसेट / नया फॉर्म
        </button>
        <button 
          type="button" 
          className="btn btn-primary"
          onClick={handlePrint}
        >
          <Printer size={18} /> प्रिंट करें (Print / PDF)
        </button>
      </div>

      {/* Live Camera Popup Modal */}
      {showCameraModal && (
        <div className="no-print" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            maxWidth: '460px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: '#7B1113', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={20} /> लाइव कैमरा फोटो
              </h3>
              <button 
                type="button" 
                onClick={stopCamera} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={22} color="#666" />
              </button>
            </div>

            <div style={{
              position: 'relative',
              width: '100%',
              height: '300px',
              background: '#000',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={stopCamera}
                style={{ padding: '8px 16px', color: '#333' }}
              >
                रद्द करें (Cancel)
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={capturePhotoFromCamera}
                style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Camera size={16} /> फोटो खींचें (Capture)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
