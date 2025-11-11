const express = require("express");
const router = express.Router();
const Donor = require("../models/Donor");
const Hospital = require("../models/Hospital");
const OrganRequest = require("../models/OrganRequest"); // ✅ Add this import

// ===============================
// ✅ GET ALL DONORS (Admin Dashboard)
// ===============================
router.get("/donors", async (req, res) => {
  try {
    const donors = await Donor.find(
      {},
      {
        "personalDetails.firstName": 1,
        "personalDetails.lastName": 1,
        "personalDetails.city": 1,
        "medicalDetails.bloodGroup": 1,
      }
    );

    const formatted = donors.map((d) => ({
      id: d._id,
      name: `${d.personalDetails.firstName} ${d.personalDetails.lastName}`,
      city: d.personalDetails.city,
      bloodGroup: d.medicalDetails.bloodGroup || "N/A",
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error fetching donors:", error);
    res.status(500).json({ message: "Failed to fetch donors" });
  }
});

// ===============================
// ✅ DELETE DONOR
// ===============================
router.delete("/donors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const donor = await Donor.findByIdAndDelete(id);
    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    console.log(`🗑️ Donor ${id} deleted successfully`);
    res.status(200).json({ message: "Donor deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting donor:", error);
    res.status(500).json({ message: "Failed to delete donor" });
  }
});

// ===============================
// ✅ GET ALL HOSPITALS
// ===============================
router.get("/hospitals", async (req, res) => {
  try {
    const hospitals = await Hospital.find(
      {},
      {
        hospitalName: 1,
        city: 1,
        hospitalEmail: 1,
        hospitalPhone: 1,
      }
    );

    const formatted = hospitals.map((h) => ({
      id: h._id,
      hospitalName: h.hospitalName || "N/A",
      city: h.city || "N/A",
      email: h.hospitalEmail || "N/A",
      phone: h.hospitalPhone || "N/A",
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error fetching hospitals:", error);
    res.status(500).json({ message: "Failed to fetch hospitals" });
  }
});

// ===============================
// ✅ DELETE HOSPITAL
// ===============================
router.delete("/hospitals/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const hospital = await Hospital.findByIdAndDelete(id);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    console.log(`🏥 Hospital ${id} deleted successfully`);
    res.status(200).json({ message: "Hospital deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting hospital:", error);
    res.status(500).json({ message: "Failed to delete hospital" });
  }
});

// ===============================
// ✅ GET ALL ORGAN REQUESTS
// ===============================
router.get("/requests", async (req, res) => {
  try {
    const requests = await OrganRequest.find()
      .populate("patient", "name age bloodGroup email")
      .populate("hospital", "hospitalName city")
      .lean();

    const formatted = requests.map((r) => ({
      id: r._id,
      patientName: r.patient?.name || "N/A",
      hospitalName: r.hospital?.hospitalName || "N/A",
      city: r.hospital?.city || "N/A",
      organNeeded: r.organNeeded || "N/A",
      urgency: r.urgency || "N/A",
      status: r.status || "pending",
      createdAt: r.createdAt,
      donorCount: r.matchedDonors?.length || 0,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error fetching organ requests:", error);
    res.status(500).json({ message: "Failed to fetch organ requests" });
  }
});

// ===============================
// ✅ DELETE ORGAN REQUEST
// ===============================
router.delete("/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const request = await OrganRequest.findByIdAndDelete(id);
    if (!request) {
      return res.status(404).json({ message: "Organ request not found" });
    }

    console.log(`🧾 Organ Request ${id} deleted successfully`);
    res.status(200).json({ message: "Organ request deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting organ request:", error);
    res.status(500).json({ message: "Failed to delete organ request" });
  }
});

// ===============================
// ✅ DASHBOARD COUNTS
// ===============================
router.get("/stats", async (req, res) => {
  try {
    const donorCount = await Donor.countDocuments();
    const hospitalCount = await Hospital.countDocuments();
    const requestCount = await OrganRequest.countDocuments();

    res.json({
      donors: donorCount,
      hospitals: hospitalCount,
      requests: requestCount,
    });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

module.exports = router;
