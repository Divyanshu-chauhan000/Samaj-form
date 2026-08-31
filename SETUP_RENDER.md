# 🚀 Render Deployment Setup Guide

## Your Deployed URLs

- **Frontend/Form**: https://samaj-parichay-form.onrender.com
- **Admin Panel**: https://samaj-form-admin.onrender.com
- **Backend API**: https://samaj-parichay-form.onrender.com/api (same as frontend URL)

---

## 📋 Render Dashboard Setup

### Step 1: Add Backend Environment Variables

Go to your **Backend** service on Render → Settings → Environment Variables

Add these variables:

```
MONGODB_URI=your_mongodb_connection_string
GOOGLE_SHEETS_ID=your_google_sheets_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your_private_key_with_escaped_newlines
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=https://samaj-parichay-form.onrender.com
ADMIN_URL=https://samaj-form-admin.onrender.com
PORT=5000
NODE_ENV=production
```

### Step 2: Add Frontend Environment Variables

Go to your **Frontend** service on Render → Settings → Environment Variables

Add:
```
VITE_API_BASE_URL=https://samaj-parichay-form.onrender.com
```

### Step 3: Add Admin Environment Variables

Go to your **Admin** service on Render → Settings → Environment Variables

Add:
```
VITE_API_BASE_URL=https://samaj-parichay-form.onrender.com
VITE_FORM_URL=https://samaj-parichay-form.onrender.com
```

---

## 🔧 Build & Deploy Configuration

### Backend Service Setup

**Service Type**: Web Service  
**Runtime**: Node  
**Root Directory**: (leave empty or root of repo)

**Build Command**:
```bash
npm install --prefix backend
```

**Start Command**:
```bash
cd backend && node server.js
```

### Frontend Service Setup

**Service Type**: Web Service / Static Site  
**Runtime**: Node  
**Root Directory**: (leave empty or root of repo)

**Build Command**:
```bash
npm install --prefix frontend && npm run build --prefix frontend
```

**Start Command** (if Web Service):
```bash
npm install --prefix frontend && npm run build --prefix frontend && npm start --prefix frontend
```

**Publish Directory** (if Static Site):
```
frontend/dist
```

### Admin Service Setup

**Service Type**: Web Service / Static Site  
**Runtime**: Node  
**Root Directory**: (leave empty or root of repo)

**Build Command**:
```bash
npm install --prefix admin && npm run build --prefix admin
```

**Start Command** (if Web Service):
```bash
npm install --prefix admin && npm run build --prefix admin && npm start --prefix admin
```

**Publish Directory** (if Static Site):
```
admin/dist
```

---

## 🔗 How It All Works Together

```
┌─────────────────────────────────────────┐
│   samaj-form-admin.onrender.com         │
│   (Admin Panel)                         │
│   ↓ makes API calls to ↓                │
│   samaj-parichay-form.onrender.com/api  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   samaj-parichay-form.onrender.com      │
│   (Frontend Form)                       │
│   ↓ makes API calls to ↓                │
│   samaj-parichay-form.onrender.com/api  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   samaj-parichay-form.onrender.com      │
│   (Backend API Server)                  │
│   - Serves /api/* endpoints             │
│   - Connects to MongoDB Atlas           │
│   - Connects to Google Sheets           │
│   - Handles file uploads to Cloudinary  │
└─────────────────────────────────────────┘
```

---

## ✅ Testing the Setup

1. **Test Frontend Form**:
   - Open: https://samaj-parichay-form.onrender.com
   - Try uploading a photo
   - Submit a form
   - Check if data saves (no errors in browser console)

2. **Test Admin Panel**:
   - Open: https://samaj-form-admin.onrender.com
   - Should see records from MongoDB
   - Click "फॉर्म पर जाएँ" button
   - Should redirect to Frontend

3. **Test API Connection**:
   - Open: https://samaj-parichay-form.onrender.com/api/records
   - Should return JSON with all records (no CORS errors)

---

## 🛠️ Troubleshooting

### CORS Errors
If you see "CORS policy" errors in browser console:
1. Check that `FRONTEND_URL` and `ADMIN_URL` env vars are set on Backend
2. Verify the exact URLs match (https://, trailing slash, etc.)

### API Not Found (404)
- Check Backend service is running
- Verify `VITE_API_BASE_URL` is set correctly in Frontend/Admin env vars
- Check that API routes are loaded in backend/server.js

### Admin Won't Link to Form
- Check `VITE_FORM_URL` env var on Admin service
- Should be: `https://samaj-parichay-form.onrender.com`

### MongoDB Connection Failed
- Verify `MONGODB_URI` is correct and includes username:password
- Check MongoDB Atlas network access allows Render's IP (0.0.0.0/0)

---

## 📝 Notes

- All frontend/admin are static builds (no server-side runtime needed after build)
- Backend is the only service that needs Node.js runtime
- All inter-service communication happens through HTTPS URLs
- API responses should include CORS headers
