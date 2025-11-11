// routes/doctorRoutes.js
const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");

// Create doctor
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, specialization, hospital } = req.body;
    if (!name || !hospital) {
      return res.status(400).json({ message: "Name and hospital are required" });
    }
    const doctor = new Doctor({ name, email, phone, specialization, hospital });
    const saved = await doctor.save();
    res.status(201).json({ message: "Doctor created", doctor: saved });
  } catch (err) {
    console.error("Error creating doctor:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get doctors for a hospital
router.get("/hospital/:hospitalId", async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const doctors = await Doctor.find({ hospital: hospitalId }).sort({ createdAt: -1 });
    res.json({ doctors });
  } catch (err) {
    console.error("Error fetching doctors:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete doctor
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const d = await Doctor.findByIdAndDelete(id);
    if (!d) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: "Doctor removed" });
  } catch (err) {
    console.error("Error deleting doctor:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
