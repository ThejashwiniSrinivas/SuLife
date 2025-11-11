const Donor = require("../models/Donor");
const fetch = require('node-fetch');

// Strict blood group match (identical strings)
function strictBloodMatch(recipient, donor) {
  return recipient === donor;
}

// Call AI prediction API
async function getAIPrediction(features) {
  const response = await fetch('http://127.0.0.1:5001/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(features)
  });
  const data = await response.json();
  return data;  // Expect 0 or 1
}

async function matchDonors(request) {
  let { organNeeded, patientAge, bloodGroup, city, type, urgency } = request;
  const today = new Date();

  urgency = typeof urgency === "string" ? urgency.trim().toLowerCase() : "";
  city = typeof city === "string" ? city.trim().toLowerCase() : "";
  patientAge = Number(patientAge);

 console.log("Starting Donor.find() query...");
const donors = await Donor.find({ "consent.consentChecked": true }).lean();
console.log("Finished Donor.find() query. Found donors:", donors.length);


  // Step 1: Eligibility filtering
  const eligibleDonors = donors.filter((donor) => {
    const donorName = donor.personalDetails?.firstName + " " + donor.personalDetails?.lastName;
    const donorBlood = donor.medicalDetails?.bloodGroup;

    if (!donorBlood) {
      console.log(`Skipped ${donorName}: No blood group`);
      return false;
    }
    if (!bloodGroup) {
      console.log(`Skipped ${donorName}: Recipient blood group unknown`);
      return false;
    }
    if (!strictBloodMatch(bloodGroup, donorBlood)) {
      console.log(`Skipped ${donorName}: Blood group not exact match (${donorBlood} -> ${bloodGroup})`);
      return false;
    }
    if (type === "Blood") {
      console.log(`Potential eligible donor: ${donorName} (Blood)`);
      return true;
    }
    if (type === "Organ") {
      const requestedOrgan = organNeeded?.trim().toLowerCase();
      const donorLivingOrgans = donor.donationType?.livingOrgans || [];
      const organsLower = donorLivingOrgans.map(o => o.toLowerCase());

      if (!requestedOrgan || !organsLower.includes(requestedOrgan)) {
        console.log(`Skipped ${donorName}: Organ ${requestedOrgan} not available`);
        return false;
      }

      const alreadyDonated = (donor.donatedOrgans || [])
        .map((o) => o.organ?.toLowerCase())
        .filter(Boolean);
      if (alreadyDonated.includes(requestedOrgan)) {
        console.log(`Skipped ${donorName}: Organ ${requestedOrgan} already donated`);
        return false;
      }
      console.log(`Potential eligible donor: ${donorName} (Organ)`);
      return true;
    }
    return false;
  });

  // Step 2: Query AI prediction for each eligible donor
  let matches = [];
  for (const donor of eligibleDonors) {
    const features = {
      bloodMatch: 1, // As blood groups already strictly matched
      organMatch: type === "Organ" && organNeeded && donor.donationType?.livingOrgans?.some(o => o.toLowerCase() === organNeeded.toLowerCase()) ? 1 : 0,
      ageDiff: Math.abs(Number(donor.personalDetails?.age) - patientAge),
      urgency: urgency === "high" ? 3 : urgency === "medium" ? 2 : urgency === "low" ? 1 : 0,
      cityMatch: city === donor.personalDetails?.city?.toLowerCase() ? 1 : 0,
      consent: donor.consent?.consentChecked ? 1 : 0
    };

    try {
      console.log("Predicting with features:", features);
const prediction = await getAIPrediction(features);
console.log("Received prediction:", prediction);
      if (prediction.probability > 0.4) {
        matches.push({
          donorId: donor.donorId,
          name: donor.personalDetails?.firstName + " " + donor.personalDetails?.lastName,
          age: donor.personalDetails?.age,
          city: donor.personalDetails?.city,
          bloodGroup: donor.medicalDetails?.bloodGroup || "Unknown",
          features,  // for inspection/debugging
          score: prediction.probability,
          donorObject: donor
        });
      }
    } catch (error) {
      console.error(`Prediction failed for donor ${donor.donorId}:`, error);
    }
  }

  // Step 3: Exclude recent blood donors within 90 days (blood only)
  if (type === "Blood") {
    matches = matches.filter((m) => {
      const lastDonation = m.donorObject.donationType?.blood?.lastDonationDate;
      if (
        lastDonation &&
        (today - new Date(lastDonation)) / (1000 * 60 * 60 * 24) < 90
      ) {
        console.log(
          `Filtered ${m.name}: Donated blood in last 90 days (${lastDonation})`
        );
        return false;
      }
      return true;
    });
  }

  // Step 4: Clean up donorObject before returning
  const cleanedMatches = matches.map(({ donorObject, features, ...rest }) => rest);

  // Step 5: Sort by donor age proximity ascending (optional, you can change)
  cleanedMatches.sort((a, b) => Math.abs(a.age - patientAge) - Math.abs(b.age - patientAge));

  // Step 6: Return top 5 matches
  return cleanedMatches.slice(0, 5);
}

module.exports = matchDonors;
