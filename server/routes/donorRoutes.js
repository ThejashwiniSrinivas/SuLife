const express = require("express");
const bcrypt = require("bcryptjs");
const exportDonors = require("../utils/exportDonors");
const upload = require("../middleware/uploadMiddleware");
const Donor = require("../models/Donor");
const Hospital = require("../models/Hospital");
const OrganRequest = require("../models/OrganRequest");
const DonationHistory = require("../models/DonationHistory");
const {
  registerDonor,
  loginDonor,
  getDonorProfile,
  updateDonor,
} = require("../controllers/donorController");

const router = express.Router();

// ------------------------------
// ✅ Donor Registration & Login
// ------------------------------
router.post("/register", upload.single("medicalReports"), registerDonor);
router.post("/login", loginDonor);

// ------------------------------
// ✅ Export Donors Data as CSV
// ------------------------------
router.get("/export/all", async (req, res) => {
  try {
    const filePath = await exportDonors();
    res.download(filePath);
  } catch (err) {
    console.error("❌ Donor Export Error:", err);
    res.status(500).json({ message: "Failed to export donors" });
  }
});

// ------------------------------
// ✅ Fetch & Update Donor Profile
// ------------------------------
router.get("/:donorId", getDonorProfile);
router.put("/:donorId", updateDonor);

// ------------------------------
// ✅ Change Donor Password
// ------------------------------
router.put("/:donorId/change-password", async (req, res) => {
  const donorId = req.params.donorId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Both current and new passwords are required" });
  }

  try {
    const donor = await Donor.findOne({ donorId });
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    const isMatch = await bcrypt.compare(currentPassword, donor.personalDetails.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    donor.personalDetails.password = await bcrypt.hash(newPassword, salt);
    await donor.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("❌ Donor Password Change Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ------------------------------
// ✅ Donor Blood Donation
// ------------------------------
router.post("/donate-blood/:donorId", async (req, res) => {
  try {
    const donor = await Donor.findOne({ donorId: req.params.donorId });
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    donor.donationType.blood.lastDonationDate = new Date();
    await donor.save();

    res.json({ message: "✅ Blood donation recorded successfully", donor });
  } catch (err) {
    console.error("❌ Error updating blood donation:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ------------------------------
// ✅ Donor Notifications
// ------------------------------
router.get("/:donorId/notifications", async (req, res) => {
  try {
    const donor = await Donor.findOne({ donorId: req.params.donorId });
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    const enrichedNotifications = await Promise.all(
      donor.pendingNotifications.map(async (notif) => {
        const request = await OrganRequest.findById(notif.requestId).populate("hospital");

        return {
          ...notif._doc,
          hospitalName: request?.hospital?.hospitalName || "Unknown",
          hospitalCity: request?.hospital?.city || "Unknown",
          organNeeded: request?.organNeeded || "N/A",
          urgency: request?.urgency || "Not specified",
          status: request?.status || "pending",
          createdAt: notif._doc?.createdAt || new Date(),
        };
      })
    );

    res.json({ notifications: enrichedNotifications || [] });

    // Remove sent notifications
    const sentIds = enrichedNotifications.map((n) => n.requestId);
    await Donor.updateOne(
      { donorId: req.params.donorId },
      { $pull: { pendingNotifications: { requestId: { $in: sentIds } } } }
    );
  } catch (err) {
    console.error("❌ Error fetching donor notifications:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Clear a single notification
router.post("/:donorId/notifications/clear", async (req, res) => {
  try {
    const { requestId } = req.body;
    await Donor.findOneAndUpdate(
      { donorId: req.params.donorId },
      { $pull: { pendingNotifications: { requestId } } }
    );
    res.json({ message: "Notification cleared" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ------------------------------
// ✅ Donor Incoming Requests
// ------------------------------
router.get("/:donorId/incoming-requests", async (req, res) => {
  try {
    const donor = await Donor.findOne({ donorId: req.params.donorId });
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    const detailedRequests = await Promise.all(
      donor.pendingNotifications.map(async (notif) => {
        const request = await OrganRequest.findById(notif.requestId)
          .populate("hospital", "hospitalName city state hospitalPhone")
          .populate("patient", "name age bloodGroup");

        if (!request) return null;

        return {
          requestId: request._id,
          organNeeded: request.organNeeded || "N/A",
          urgency: request.urgency || "Not specified",
          hospitalName: request.hospital?.hospitalName || "Unknown",
          hospitalCity: request.hospital?.city || "Unknown",
          createdAt: request?.createdAt || new Date(),
        };
      })
    );

    res.json({ requests: detailedRequests.filter(Boolean) });

    const sentIds = detailedRequests.map((n) => n?.requestId).filter(Boolean);
    await Donor.updateOne(
      { donorId: req.params.donorId },
      { $pull: { pendingNotifications: { requestId: { $in: sentIds } } } }
    );
  } catch (error) {
    console.error("Error fetching donor requests:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------------------
// ✅ Donor Respond to Organ Request (accept/decline)
// ------------------------------
router.post("/:donorId/respond", async (req, res) => {
  try {
    const { donorId } = req.params;
    const { requestId, action } = req.body;

    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const donor = await Donor.findOne({ donorId });
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    const request = await OrganRequest.findById(requestId)
      .populate("hospital")
      .populate("patient");

    if (!request) return res.status(404).json({ message: "Request not found" });

    const hospital = await Hospital.findById(request.hospital._id);
    if (!hospital) return res.status(404).json({ message: "Hospital not found" });

    if (action === "accept") {
      // ✅ Mark request finalized
      request.acceptanceFinalized = true;
      await request.save();

      // ✅ Add response to hospital
      hospital.donorResponses.push({
        donorId: donor.donorId,
        donorName: donor.personalDetails.firstName + " " + donor.personalDetails.lastName,
        donorCity: donor.personalDetails.city,
        donorAge: donor.personalDetails.age,
        donorPhone: donor.personalDetails.phone,
        requestId: request._id,
        organNeeded: request.organNeeded,
        urgency: request.urgency,
        status: "accepted",
        createdAt: new Date(),
      });
      await hospital.save();

      // ✅ Add to donation history
      await DonationHistory.create({
        donorId: donor.donorId,
        donorName: donor.personalDetails.firstName + " " + donor.personalDetails.lastName,
        organ: request.organNeeded,
        patientId: request.patient._id,
        patientName: request.patient.name,
        hospitalId: hospital._id,
      });

      // ✅ Prevent future donation
      if (request.organNeeded.toLowerCase() === "blood") {
        donor.donationType.blood.lastDonationDate = new Date();
      } else {
        donor.donatedOrgans.push({ organ: request.organNeeded });
      }

      // ✅ Remove notification
      donor.pendingNotifications = donor.pendingNotifications.filter(
        (n) => n.requestId.toString() !== requestId
      );
      await donor.save();

      return res.json({ message: "You accepted the request. Hospital notified." });
    }

    if (action === "decline") {
      // ✅ Record decline in hospital
      hospital.donorResponses.push({
        donorId: donor.donorId,
        donorName: donor.personalDetails.firstName + " " + donor.personalDetails.lastName,
        donorCity: donor.personalDetails.city,
        donorAge: donor.personalDetails.age,
        donorPhone: donor.personalDetails.phone,
        requestId: request._id,
        organNeeded: request.organNeeded,
        urgency: request.urgency,
        status: "declined",
        createdAt: new Date(),
      });
      await hospital.save();

      // ✅ Remove notification
      donor.pendingNotifications = donor.pendingNotifications.filter(
        (n) => n.requestId.toString() !== requestId
      );
      await donor.save();

      return res.json({ message: "You declined the request." });
    }
  } catch (err) {
    console.error("❌ Error in donor respond route:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
