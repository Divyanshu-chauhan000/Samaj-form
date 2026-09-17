const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const dns = require('dns');
dns.setServers([
  '8.8.8.8',
  '8.8.4.4'
])

const connectDB = require("./config/db");
const apiRoutes = require("./routes/apiRoutes");
const { uploadsDir } = require("./config/cloudinary");

const app = express();
const PORT = process.env.PORT || 5000;

// Enable proxy trust for cloud platforms like Render / Heroku
app.set("trust proxy", 1);

// Connect to MongoDB Atlas
connectDB();

// CORS Configuration

const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins for the public form and static assets
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Static routes
app.use("/uploads", express.static(uploadsDir));

// API Routes
app.use("/api", apiRoutes);

// Base route
app.get("/", (req, res) => {
  res.send("API is running");
});

// Server listener
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Samaj Parichay Form Backend Running on Port ${PORT}`);
  console.log(` Uploads: ${uploadsDir}`);
  console.log(`=================================================`);
});

module.exports = app;
