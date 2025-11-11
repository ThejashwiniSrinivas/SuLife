require('dotenv').config();
const mongoose = require('mongoose');
const Donor = require('./models/Donor'); // Adjust path

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const count = await Donor.countDocuments();
  console.log("Donor count:", count);
  await mongoose.disconnect();
}

test().catch(console.error);
