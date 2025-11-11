const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Update this with your actual MongoDB connection string
const mongoURI = "mongodb+srv://sulife:sulife123@cluster0.mgi5e.mongodb.net/sulife?retryWrites=true&w=majority";

// Models
const Donor = require("./models/Donor"); // adjust path if different
const OrganRequest = require("./models/OrganRequest"); // adjust path if different

// Connect to MongoDB
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", async function () {
  console.log("Connected to MongoDB");

  try {
    // Export donors
    const donors = await Donor.find().lean();
    fs.writeFileSync(
      path.join(__dirname, "../ai_server/data/donors.json"),
      JSON.stringify(donors, null, 2)
    );
    console.log("Donors exported to ai_server/data/donors.json");

    // Export organ requests / patients
    const patients = await OrganRequest.find().lean();
    fs.writeFileSync(
      path.join(__dirname, "../ai_server/data/patients.json"),
      JSON.stringify(patients, null, 2)
    );
    console.log("Patients exported to ai_server/data/patients.json");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
