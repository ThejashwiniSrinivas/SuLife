const express = require("express");
const Hospital = require("../models/Hospital.js");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const router = express.Router();

// Multer storage
const storage = multer.diskStorage({
  destination: "uploads/licenses/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Register hospital
router.post("/register", upload.single("licenseCertificate"), async (req, res) => {
  try {
    console.log("📥 Incoming registration request:", req.body);
    console.log("📎 Uploaded file:", req.file);

    const {
      hospitalName,
      registrationNumber,
      ownership,
      city,
      state,
      pincode,
      hospitalEmail,
      hospitalPhone,
      authorizedName,
      authorizedDesignation,
      authorizedPhone,
      authorizedEmail,
      password,
    } = req.body;

    // Check duplicate email
    const existingHospital = await Hospital.findOne({ hospitalEmail });
    if (existingHospital) {
      console.log("⚠️ Hospital with this email already exists:", hospitalEmail);
      return res.status(400).json({ message: "Hospital already registered with this email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Unique hospital ID
    const hospitalId = "HOSP-" + Math.floor(100000 + Math.random() * 900000);

    // Save hospital
    const newHospital = new Hospital({
      hospitalName,
      registrationNumber,
      ownership,
      city,
      state,
      pincode,
      hospitalEmail,
      hospitalPhone,
      authorizedName,
      authorizedDesignation,
      authorizedPhone,
      authorizedEmail,
      password: hashedPassword,
      licenseCertificate: req.file ? req.file.filename : null,
      hospitalId,
    });

    const savedHospital = await newHospital.save();
    console.log("✅ Hospital registered successfully:", savedHospital);

    res.status(201).json({ message: "Hospital registered successfully", hospitalId });
  } catch (error) {
    console.error("❌ Registration Error:", error);

    // If Mongoose validation error
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: "Validation Error", errors: messages });
    }

    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Login hospital with JWT
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hospital = await Hospital.findOne({ hospitalEmail: email });
    if (!hospital) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, hospital.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 🔑 Generate JWT
    const token = jwt.sign(
      { hospitalId: hospital.hospitalId, email: hospital.hospitalEmail, role: "hospital" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      role: "hospital",
      hospitalId: hospital.hospitalId,
      hospitalName: hospital.hospitalName, // ✅ Include hospitalName for frontend
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Login hospital with JWT
router.post("/login", async (req, res) => {
  // ... existing login code
});

// ✅ Get hospital by hospitalId
router.get("/:hospitalId", async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const hospital = await Hospital.findOne({ hospitalId }).select("-password");
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Update hospital profile
router.put("/:hospitalId", async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const updatedHospital = await Hospital.findOneAndUpdate(
      { hospitalId },
      req.body,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedHospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    res.json({
      message: "Profile updated successfully",
      hospital: updatedHospital,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get organ request count for hospital
router.get("/:hospitalId/requests/count", async (req, res) => {
  try {
    const hospitalDoc = await Hospital.findOne({ hospitalId: req.params.hospitalId });
    if (!hospitalDoc) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    const count = await require("../models/OrganRequest").countDocuments({ hospital: hospitalDoc._id });

    res.json({ count });
  } catch (error) {
    console.error("Error fetching requests count:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get donor responses notifications for hospital
router.get("/:hospitalId/notifications", async (req, res) => {
  const { hospitalId } = req.params;
  let hospital = null;

  try {
    if (mongoose.Types.ObjectId.isValid(hospitalId)) {
      hospital = await Hospital.findById(hospitalId).select("donorResponses");
    } else {
      hospital = await Hospital.findOne({ hospitalId });
    }

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    // Return all donorResponses
    res.json({ notifications: hospital.donorResponses || [] });

    // Optional: If you want one-time delivery, uncomment:
    // await Hospital.updateOne({ _id: hospitalId }, { $set: { donorResponses: [] } });
  } catch (error) {
    console.error("❌ Error fetching hospital notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Clear a specific notification after hospital views it
router.post("/:hospitalId/notifications/clear", async (req, res) => {
  const { hospitalId } = req.params;
  const { donorId, requestId, status } = req.body;

  try {
    const query = mongoose.Types.ObjectId.isValid(hospitalId)
      ? { _id: hospitalId }
      : { hospitalId };

    await Hospital.updateOne(
      query,
      { $pull: { donorResponses: { donorId, requestId, status } } }
    );

    res.json({ message: "Notification cleared" });
  } catch (error) {
    console.error("❌ Error clearing hospital notification:", error);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
