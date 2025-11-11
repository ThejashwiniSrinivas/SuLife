// server/models/Donor.js
const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema(
  {
    donorId: {
      type: String,
      unique: true,
      required: true,
    },
    personalDetails: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      age: Number,
      gender: String,
      phone: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    medicalDetails: {
      bloodGroup: String,
      medicalHistory: [String], 
      existingConditions: String,
    },
    nomineeDetails: {
      name: String,
      relation: String,
      phone: String,
      email: String,
      address: String,
    },
    donationType: {
  blood: {
    agreed: { type: Boolean, default: false }, // consent only for blood
    lastDonationDate: { type: Date, default: null },
  },
  livingOrgans: [{ type: String }], // directly store names
  posthumousOrgans: [{ type: String }], // directly store names
},
donatedOrgans: [
  {
    organ: String,           // organ name
    donatedAt: { type: Date, default: Date.now },
  },
],
    consent: {
      consentChecked: { type: Boolean, default: false },
    },
    medicalReports: {
      type: String, // file path / link
    },
   pendingNotifications: [
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "OrganRequest" },
    patientName: String,
    organNeeded: String,
    urgency: String,
    hospitalName: String,
    hospitalCity: String,
    createdAt: { type: Date, default: Date.now },
  }
],

// ✅ Add this below as a new field
  currentRequest: {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "OrganRequest" },
    status: { type: String, enum: ["pending", "accepted", "declined", "rejected"], default: "pending" },
    notifiedAt: { type: Date, default: Date.now },
    timeoutAt: { type: Date }
  },
blockedDonations: [
  {
    organ: String,         // Name of the organ or "Blood"
    blockedUntil: Date,    // For blood: 90 days from last donation, for organ: indefinite
  }
],
  },
  
  
  { timestamps: true }
);


module.exports = mongoose.model("Donor", donorSchema);
