const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const { uploadPhoto } = require("../controllers/uploadController");
const {
  submitForm,
  getAllRecords,
  getRecordById,
  deleteRecord,
} = require("../controllers/submissionController");
const { exportToCsv } = require("../controllers/exportController");

// Photo Upload Endpoint
router.post("/upload", upload.single("photo"), uploadPhoto);

// Submit / Edit Form Endpoint
router.post("/submit", submitForm);

// Get All Submissions (Admin)
router.get("/records", getAllRecords);

// Get Single Record by ID / Mobile Number
router.get("/records/:id", getRecordById);

// Delete Record Endpoint
router.delete("/records/:id", deleteRecord);

// Export All Records to CSV/Excel Endpoint
router.get("/export/excel", exportToCsv);

module.exports = router;
