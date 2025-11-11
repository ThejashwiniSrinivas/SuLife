const { MongoClient } = require("mongodb");
const { exec } = require("child_process");
const path = require("path");
require("dotenv").config(); // Load .env variables
const workingDir = path.resolve(__dirname, "../ml_training");
const MONGO_URI = process.env.MONGO_URI;

async function startWatching() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("sulife");
    const donorsCollection = db.collection("donors");
    const organRequestsCollection = db.collection("organrequests");

    // Watch donors collection
    const donorChangeStream = donorsCollection.watch();
    donorChangeStream.on("change", (change) => {
      console.log("Donor data changed:", change);
      retrainModel("donors");
    });

    // Watch organrequests collection
    const organRequestChangeStream = organRequestsCollection.watch();
    organRequestChangeStream.on("change", (change) => {
      console.log("Organ request data changed:", change);
      retrainModel("organrequests");
    });

    console.log("Watching MongoDB change streams...");
  } catch (error) {
    console.error("Error connecting to MongoDB or watching change streams:", error);
  }
}

function retrainModel(collectionName) {
  console.log(`Retraining model due to changes in ${collectionName}...`);

  // Path to your Python training script relative to this Node.js file
  const pythonScriptPath = path.join(__dirname, "../ml_training/train_labeled_model.py");

  exec(`python "${pythonScriptPath}"`, { cwd: workingDir }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing training script: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Training script stderr: ${stderr}`);
      return;
    }
    console.log(`Training script output:\n${stdout}`);
  });
}

startWatching();
