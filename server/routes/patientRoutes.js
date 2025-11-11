// patientRoutes.js
const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const Hospital = require("../models/Hospital");

// --- Add patient ---
router.post("/", async (req, res) => {
  try {
    const { hospital: hospitalId, ...patientData } = req.body;

    // 1️⃣ Find hospital by hospitalId
    const hospital = await Hospital.findOne({ hospitalId });
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    // 2️⃣ Create patient with correct hospital ObjectId
    const patient = await Patient.create({
      ...patientData,
      hospital: hospital._id,
    });

    res.status(201).json({ patient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// --- Delete patient ---
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Patient.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Patient not found" });
    res.json({ message: "Patient removed successfully" });
  } catch (err) {
    console.error("Error deleting patient:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// --- Get patients by hospitalId ---
router.get("/hospital/:hospitalId", async (req, res) => {
  try {
    const { hospitalId } = req.params;

    const hospital = await Hospital.findOne({ hospitalId });
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    const patients = await Patient.find({ hospital: hospital._id });
    res.json({ patients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// --- Search patients by name (for autocomplete) ---
router.get("/search", async (req, res) => {
  try {
    const { q, hospitalId } = req.query;
    if (!q) return res.json({ patients: [] });

    const hospital = await Hospital.findOne({ hospitalId });
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    const regex = new RegExp(q, "i"); // case-insensitive search
   const patients = await Patient.find(
  { hospital: hospital._id, name: regex },
  {
    name: 1,
    age: 1,
    bloodGroup: 1,
    "condition.organNeeded": 1,
    "condition.urgency": 1,
    "condition.notes": 1
  }
).limit(10);


    // Map to a simpler structure for autocomplete
    const results = patients.map(p => ({
      id: p._id,
      name: p.name,
      age: p.age || "",
      bloodGroup: p.bloodGroup || "",
      organNeeded: p.condition?.organNeeded || "",
      urgency: p.condition?.urgency || "",
    }));

    res.json({ patients: results });
  } catch (err) {
    console.error("❌ Error searching patients:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// --- Get patient by ID (including condition) ---
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (err) {
    console.error("Error fetching patient:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// --- Update patient condition ---
router.put("/:id/condition", async (req, res) => {
  try {
    const { id } = req.params;
    const { healthStatus, organNeeded, bloodType, urgency, notes, type } = req.body;

    const patient = await Patient.findById(id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // Update condition
    patient.condition = {
      healthStatus: healthStatus || "",
      organNeeded: organNeeded || "",
      bloodType: bloodType || "",
      urgency: urgency || "",
      notes: notes || "",
      type: type || "Organ",
    };

    await patient.save();

    res.json({ message: "Condition updated successfully", condition: patient.condition });
  } catch (err) {
    console.error("Error updating patient condition:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// --- Get patient count for a hospital ---
router.get("/hospital/:hospitalId/count", async (req, res) => {
  try {
    const { hospitalId } = req.params;

    // Use hospitalId field instead of _id
    const hospital = await Hospital.findOne({ hospitalId });
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    const count = await Patient.countDocuments({ hospital: hospital._id });
    res.json({ count });
  } catch (err) {
    console.error("Error fetching patients count:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


module.exports = router;
