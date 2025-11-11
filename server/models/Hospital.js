const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
  // Step 1: Hospital Info
  hospitalName: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  ownership: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },

  // Step 2: Contact + Authorized Person
  hospitalEmail: { type: String, required: true, unique: true }, // ✅ Unique
  hospitalPhone: { type: String, required: true },
  authorizedName: { type: String, required: true },
  authorizedDesignation: { type: String, required: true },
  authorizedPhone: { type: String, required: true },
  authorizedEmail: { type: String, required: true },

  // Step 3: Credentials + License
  password: { type: String, required: true },
  licenseCertificate: { type: String }, // file path / URL
  hospitalId: { type: String, unique: true }, // ✅ Unique hospital ID

  createdAt: { type: Date, default: Date.now },

  donorResponses: [
  {
    donorId: { type: String, required: true },      // Donor's unique ID
    donorName: String,                              // Donor full name
    donorCity: String,                              // Donor city
    donorAge: Number,                               // Donor age
    donorPhone: String,                             // Donor phone number
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "OrganRequest" }, // Reference to the organ request
    organNeeded: String,                            // Organ requested
    urgency: String,                                // Urgency level
    status: {
  type: String,
  enum: ["accepted", "declined", "rejected", "timeout"], // add timeout here
  required: true,
}, // Donor response status
    createdAt: { type: Date, default: Date.now },  // Timestamp of response
  }
],
pendingNotifications: [
  {
    donorId: String,
    donorName: String,
    donorCity: String,
    donorAge: Number,
    donorPhone: String,
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "OrganRequest" },
    organNeeded: String,
    urgency: String,
     status: { type: String, enum: ["pending", "accepted", "declined","rejected","timeout"] },
    createdAt: { type: Date, default: Date.now },
  }
]
,
donationHistory: [
  {
    donorId: String,
    donorName: String,
    organ: String,
    patientName: String,
    patientId: mongoose.Schema.Types.ObjectId,
    donatedAt: { type: Date, default: Date.now }
  }
],
});

module.exports = mongoose.model("Hospital", hospitalSchema);
