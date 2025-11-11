const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Donor = require("../models/Donor"); // adjust path if needed

async function exportDonors() {
  try {
    const donors = await Donor.find({});
    if (!donors || donors.length === 0) {
      throw new Error("No donors found in database");
    }

    const csv = donors.map(d => {
      return [
        d.donorId,
        d.personalDetails.age,
        d.medicalDetails.bloodGroup,
        (d.donationType.livingOrgans || []).join(";"),
        (d.donationType.posthumousOrgans || []).join(";"),
        (d.medicalHistory || []).join(";"),
        d.donationType.blood?.lastDonationDate || "",
        d.personalDetails.city,
        d.personalDetails.state,
        d.consent?.consentChecked
      ].join(",");
    });

    const filePath = path.join(__dirname, "../donors.csv");
    fs.writeFileSync(
      filePath,
      "donorId,age,bloodGroup,livingOrgans,posthumousOrgans,medicalHistory,lastBloodDonation,city,state,consent\n" +
      csv.join("\n")
    );

    console.log("✅ Donor data exported to donors.csv");
    return filePath;
  } catch (err) {
    console.error("❌ exportDonors Error:", err);
    throw err; // re-throw to route
  }
}

module.exports = exportDonors;
