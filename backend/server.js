const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const connectDB = require("./config/db");
const apiRoutes = require("./routes/apiRoutes");
const { uploadsDir } = require("./config/cloudinary");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable proxy trust for cloud platforms like Render / Heroku
app.set("trust proxy", 1);

// Connect to MongoDB Atlas
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Static routes
app.use("/uploads", express.static(uploadsDir));
app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));

// API Routes
app.use("/api", apiRoutes);

// Catch-all route to serve SPA frontend for any unknown path
app.get("{*path}", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
});

// Server listener
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Samaj Parichay Form Backend Running on Port ${PORT}`);
  console.log(` Uploads: ${uploadsDir}`);
  console.log(`=================================================`);
});

module.exports = app;
