const mongoose = require("mongoose");

const donationHistorySchema = new mongoose.Schema({
  donorId: { type: String, required: true },
  donorName: { type: String, required: true },
  organ: { type: String, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  patientName: { type: String, required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
  donatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DonationHistory", donationHistorySchema);
