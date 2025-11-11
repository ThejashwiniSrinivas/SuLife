require('dotenv').config();
const mongoose = require('mongoose');
const matchDonors = require('./ai/aiMatcher');

async function testMatchDonor() {
  const request = {
    organNeeded: "Partial Liver",
    patientAge: 45,
    bloodGroup: "A+",
    city: "Bengaluru",
    type: "Organ",
    urgency: "high"
  };

  try {
    const matches = await matchDonors(request);
    console.log("Top AI matched donors:", matches);
  } catch (error) {
    console.error("Error matching donors:", error);
  }
}

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  return testMatchDonor();
})
.then(() => mongoose.disconnect())
.catch(err => {
  console.error('MongoDB connection error:', err);
});
