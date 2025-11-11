  // server/middleware/uploadMiddleware.js
  const multer = require("multer");
  const path = require("path");
  const fs = require("fs");

  // Ensure uploads folder exists
  const uploadPath = path.join(__dirname, "../uploads");
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath); // ✅ safe uploads folder
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });

  const upload = multer({ storage });

  module.exports = upload; // ✅ exporting multer instance
