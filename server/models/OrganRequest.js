const mongoose = require("mongoose");

const organRequestSchema = new mongoose.Schema({
  
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },
  lastBloodDonation: {
  type: Date,
  default: null
},

  matchedDonors: [
  {
    donorId: { type: String, required: true },
    name: String,
    age: Number,
    city: String,
    score: Number,
  }
],
 donorResponses: [
  {
    donorId: String,
    status: { 
      type: String, 
      enum: ["pending", "accepted", "declined", "rejected", "timeout"], 
      default: "pending" 
    },
    notifiedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date }
  }
],
organNeeded: { type: String }, 
urgency: { type: String, enum: ["High", "Medium", "Low"], required: true },
notes: { type: String },
status: {
  type: String,
   enum: ["pending", "accepted", "declined", "rejected", "timeout"], 
  default: "pending",
},
acceptedDonor: {
  donorId: String,
  name: String,
  phone: String,
  city: String
},
currentDonorIndex: { type: Number, default: 0 }, // Tracks which donor in matchedDonors is currently notified

createdAt: { type: Date, default: Date.now },

acceptanceFinalized: { type: Boolean, default: false },

});

module.exports = mongoose.model("OrganRequest", organRequestSchema);
