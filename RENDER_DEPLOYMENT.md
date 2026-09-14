# Render Deployment Configuration (Updated)

With the recent structural updates, your project is now a **Unified Monorepo**. This makes deployment on Render incredibly simple! You no longer need 3 separate services. You only need **ONE Web Service**.

## NEW DEPLOYMENT STRUCTURE

Create a single **Web Service** on Render with the following settings:

1. **Repository**: Connect your GitHub repository `Samaj-form`.
2. **Root Directory**: `.` (leave it empty or type `.`)
3. **Environment**: `Node`
4. **Build Command**: `npm run build`
5. **Start Command**: `npm start`

That's it! The single `npm run build` command will automatically install and build both the frontend and admin panel, and `npm start` will serve everything on the same port.

## ACCESSING YOUR APPS

Once deployed, if your Render URL is `https://samaj-parichay-form.onrender.com`:

- **User Form**: `https://samaj-parichay-form.onrender.com/`
- **Admin Panel**: `https://samaj-parichay-form.onrender.com/admin/`

*(You can delete the old Static Sites for frontend and admin from your Render dashboard to save resources!)*

## ENVIRONMENT VARIABLES (Set on Render Dashboard)

Go to the **Environment** tab of your new Web Service and add these variables. You can copy most of these straight from your `.env` file:

```text
MONGODB_URI=mongodb+srv://kumawatsamaj371_db_user:2qnyhSXrKVSBgHRl@kumawat-samaj.vw6fzrp.mongodb.net/?appName=kumawat-samaj
GOOGLE_SHEETS_ID=your_google_sheets_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your_private_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=5000
```

*(Note: You no longer strictly need `FRONTEND_URL` and `ADMIN_URL` for CORS since everything is served from the same domain, but keeping them won't hurt.)*
