const express = require("express");
const router = express.Router();
const Donor = require("../models/Donor"); // adjust path if needed
const matchDonors = require("../ai/aiMatcher");

// POST /api/ai/match-donors
router.post("/match-donors", async (req, res) => {
  try {
    const organRequest = req.body; // { organNeeded, bloodGroup, urgency, city }

    // Fetch all donors from DB
    const donors = await Donor.find({});

    // Match donors
    const matched = matchDonors(donors, organRequest);

    res.json({ matchedDonors: matched });
  } catch (err) {
    console.error("❌ AI match error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
