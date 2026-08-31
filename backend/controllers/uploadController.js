const uploadPhoto = (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No image uploaded" });
  }
  const photoUrl =
    req.file.path && req.file.path.startsWith("http")
      ? req.file.path
      : `${req.headers["x-forwarded-proto"] || req.protocol || "http"}://${req.get("host")}/uploads/${req.file.filename}`;

  res.json({
    success: true,
    photoUrl,
    filename: req.file.filename || req.file.originalname,
  });
};

module.exports = {
  uploadPhoto,
};
