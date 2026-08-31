# Render Deployment Configuration
# This file contains setup instructions for deploying on Render

## DEPLOYMENT STRUCTURE

You have 3 separate services on Render:

1. **Backend API** (samaj-parichay-form.onrender.com)
   - Node.js Web Service
   - Root directory: backend/
   - Build Command: npm install
   - Start Command: node server.js

2. **Frontend Form** (samaj-parichay-form.onrender.com - alternative subdomain)
   - Static Site / Node.js
   - Root directory: frontend/
   - Build Command: npm install && npm run build
   - Publish Directory: dist/

3. **Admin Panel** (samaj-form-admin.onrender.com)
   - Static Site / Node.js
   - Root directory: admin/
   - Build Command: npm install && npm run build
   - Publish Directory: dist/

## ENVIRONMENT VARIABLES (Set on Render Dashboard)

### For Backend Service:
```
MONGODB_URI=your_mongodb_connection_string
GOOGLE_SHEETS_ID=your_google_sheets_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your_private_key (with \n for newlines)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=https://samaj-parichay-form.onrender.com
ADMIN_URL=https://samaj-form-admin.onrender.com
PORT=5000
```

### For Frontend Service:
```
VITE_API_BASE_URL=https://samaj-parichay-form.onrender.com
```

### For Admin Service:
```
VITE_API_BASE_URL=https://samaj-parichay-form.onrender.com
VITE_FORM_URL=https://samaj-parichay-form.onrender.com
```

## HOW THE LINKING WORKS

1. **Frontend** makes API calls to: `https://samaj-parichay-form.onrender.com/api/*`
2. **Admin** makes API calls to: `https://samaj-parichay-form.onrender.com/api/*`
3. **Admin** links to Frontend: `https://samaj-parichay-form.onrender.com`
4. **Backend** serves static content and APIs

## CORS CONFIGURATION

The backend allows requests from:
- http://localhost:3000
- http://localhost:3002
- http://localhost:5000
- https://samaj-parichay-form.onrender.com
- https://samaj-form-admin.onrender.com
- Environment variables: FRONTEND_URL, ADMIN_URL
