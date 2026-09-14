const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const uploadsDir = path.join(__dirname, "..", "..", "uploads");

// Configure Cloudinary credentials if present
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name_here"
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Storage configuration (Cloudinary with local fallback)
let storage;
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name_here"
) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "samaj_parichay_uploads",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
    },
  });
  console.log("[Upload Storage]: Configured to use Cloudinary cloud storage.");
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      const uniqueName = `photo_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
      cb(null, uniqueName);
    },
  });
  console.warn(
    "[Upload Storage Warning]: Cloudinary keys not found in .env! Falling back to local uploads folder."
  );
}

const upload = multer({ storage });

module.exports = {
  upload,
  uploadsDir,
};
