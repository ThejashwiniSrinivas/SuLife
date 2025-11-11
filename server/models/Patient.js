const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
    condition: {
  healthStatus: { type: String, default: "" },
  type: { type: String, default: "Organ" },      // Organ or Blood
  organNeeded: { type: String, default: "" },
  bloodType: { type: String, default: "" },      // New field
  urgency: { type: String, default: "" },
  notes: { type: String, default: "" },
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
