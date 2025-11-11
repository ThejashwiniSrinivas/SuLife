// server/controllers/donorController.js
const Donor = require("../models/Donor.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ----------------------
// Donor Registration
// ----------------------
const registerDonor = async (req, res) => {
  try {
    let donorData = JSON.parse(req.body.data || "{}");

    // Check duplicate email
    const existingDonor = await Donor.findOne({
      "personalDetails.email": donorData.personalDetails?.email,
    });
    if (existingDonor) {
      return res
        .status(400)
        .json({ message: "Donor already exists with this email" });
    }

    // Hash password
    if (donorData.personalDetails?.password) {
      const salt = await bcrypt.genSalt(10);
      donorData.personalDetails.password = await bcrypt.hash(
        donorData.personalDetails.password,
        salt
      );
    }

    // Attach uploaded file path
    if (req.file) {
      donorData.medicalReports = req.file.path;
    }

  // ----------------------
// Handle donationType
// ----------------------
donorData.donationType = {
  blood: {
    agreed:
      donorData.donationType?.blood?.agreed ||
      donorData.donationType?.isBloodDonor ||
      false,
      lastDonationDate: donorData.donationType?.blood?.lastDonationDate
      ? new Date(donorData.donationType.blood.lastDonationDate)
      : null,
  },
  // store as array of strings (organ names only)
  livingOrgans:
    donorData.donationType?.livingOrgans?.map(
      (organ) => organ.name || organ
    ) || [],
  posthumousOrgans:
    donorData.donationType?.posthumousOrgans?.map(
      (organ) => organ.name || organ
    ) || [],
};


    // Generate Donor ID
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const randomNum = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
    donorData.donorId = `DNR-${dateStr}-${randomNum}`;

    // Save donor
    const newDonor = new Donor(donorData);
    await newDonor.save();

    res.status(201).json({
      message: "Donor registered successfully",
      donorId: donorData.donorId,
    });
  } catch (error) {
    console.error("❌ Donor Registration Error:", error);
    res.status(500).json({
      message: "Server error during donor registration",
      error: error.message,
    });
  }
};

// ----------------------
// Donor Login
// ----------------------
const loginDonor = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("📥 Donor Login Attempt:", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find donor
    let donor = await Donor.findOne({ "personalDetails.email": email });
    if (!donor) {
      donor = await Donor.findOne({ email: email }); // fallback
    }

    if (!donor) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const hashedPassword = donor.personalDetails?.password;
    if (!hashedPassword) {
      return res.status(400).json({ message: "Password not set for this donor. Please reset." });
    }
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { donorId: donor.donorId, email: donor.personalDetails?.email || donor.email },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      donorId: donor.donorId,
      email: donor.personalDetails?.email || donor.email,
      role: "donor",
      token,
    });
  } catch (error) {
    console.error("❌ Donor Login Error:", error);
    res.status(500).json({
      message: "Server error during donor login",
      error: error.message,
    });
  }
};

// ----------------------
// Donor Profile
// ----------------------
const getDonorProfile = async (req, res) => {
  try {
    const donor = await Donor.findOne({ donorId: req.params.donorId });

    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    res.json(donor);
  } catch (error) {
    console.error("❌ Donor Profile Fetch Error:", error);
    res.status(500).json({
      message: "Server error during donor fetch",
      error: error.message,
    });
  }
};

// ----------------------
// Update Donor Profile
// ----------------------
const updateDonor = async (req, res) => {
  try {
    const { donorId } = req.params;
    const updatedData = req.body;

    // Fetch existing donor
    const existingDonor = await Donor.findOne({ donorId });
    if (!existingDonor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    // ----------------------
    // Handle personalDetails
    // ----------------------
    if (updatedData.personalDetails) {
      if (updatedData.personalDetails.password && updatedData.personalDetails.password.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        updatedData.personalDetails.password = await bcrypt.hash(
          updatedData.personalDetails.password,
          salt
        );
      } else {
        updatedData.personalDetails.password = existingDonor.personalDetails.password;
      }

      existingDonor.personalDetails = {
        ...existingDonor.personalDetails.toObject(),
        ...updatedData.personalDetails,
      };
    }

    // ----------------------
    // Handle nomineeDetails
    // ----------------------
    if (updatedData.nomineeDetails) {
      existingDonor.nomineeDetails = {
        ...existingDonor.nomineeDetails.toObject(),
        ...updatedData.nomineeDetails,
      };
    }

    // ----------------------
// Handle donationType
// ----------------------
if (updatedData.donationType) {
  existingDonor.donationType.blood = {
    agreed:
      updatedData.donationType.blood?.agreed ??
      existingDonor.donationType.blood?.agreed,
       lastDonationDate:
      updatedData.donationType.blood?.lastDonationDate
        ? new Date(updatedData.donationType.blood.lastDonationDate)
        : existingDonor.donationType.blood?.lastDonationDate || null,
  };

  if (updatedData.donationType.livingOrgans) {
    existingDonor.donationType.livingOrgans =
      updatedData.donationType.livingOrgans.map(
        (organ) => organ.name || organ
      );
  }

  if (updatedData.donationType.posthumousOrgans) {
    existingDonor.donationType.posthumousOrgans =
      updatedData.donationType.posthumousOrgans.map(
        (organ) => organ.name || organ
      );
  }
}


    // ----------------------
    // Merge other top-level fields
    // ----------------------
    const otherFields = { ...updatedData };
    delete otherFields.personalDetails;
    delete otherFields.nomineeDetails;
    delete otherFields.donationType;

    Object.assign(existingDonor, otherFields);

    // Save donor
    await existingDonor.save();

    res.status(200).json({
      message: "Profile updated successfully",
      donor: existingDonor,
    });
  } catch (error) {
    console.error("❌ Donor Update Error:", error);
    res.status(500).json({
      message: "Server error while updating donor",
      error: error.message,
    });
  }
};

module.exports = { registerDonor, loginDonor, getDonorProfile, updateDonor };
