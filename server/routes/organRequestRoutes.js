const express = require("express");
const OrganRequest = require("../models/OrganRequest");
const Donor = require("../models/Donor");
const Hospital = require("../models/Hospital");
const matchDonors = require("../ai/aiMatcher");
const mongoose = require('mongoose');
const router = express.Router();

const DONOR_RESPONSE_TIMEOUT = process.env.DONOR_RESPONSE_TIMEOUT || 600; // seconds

// Waits for donor response (accept/reject) or timeout
function waitForDonorResponse(io, donorId, requestId, timeoutSec = DONOR_RESPONSE_TIMEOUT) {
  return new Promise((resolve) => {
    let responded = false;

    const acceptEvent = `accept_request_${donorId}_${requestId}`;
    const rejectEvent = `reject_request_${donorId}_${requestId}`;

    const acceptListener = () => {
      responded = true;
      cleanup();
      resolve("accepted");
    };

    const rejectListener = () => {
      responded = true;
      cleanup();
      resolve("rejected");
    };

    function cleanup() {
      io.off(acceptEvent, acceptListener);
      io.off(rejectEvent, rejectListener);
    }

    io.once(acceptEvent, acceptListener);
    io.once(rejectEvent, rejectListener);

    setTimeout(async () => {
      if (!responded) {
        try {
          const freshRequest = await OrganRequest.findById(requestId);
          if (!freshRequest) {
            console.warn(`waitForDonorResponse: request ${requestId} not found (may have been deleted)`);
            cleanup();
            return resolve("timeout");
          }

          if (!freshRequest.acceptanceFinalized) {
            cleanup();
            return resolve("timeout");
          }
        } catch (err) {
          console.error("Error in waitForDonorResponse timeout check:", err);
          cleanup();
          return resolve("timeout");
        }
      }
    }, timeoutSec * 1000);
  });
}

// Handle donor acceptance and notify hospital
async function handleDonorAcceptance(io, donorDoc, request) {
  try {
    const freshRequest = await OrganRequest.findById(request._id);
    if (!freshRequest) {
      console.warn(`handleDonorAcceptance: request ${request._id} not found`);
      return;
    }
    if (freshRequest.acceptanceFinalized) return;

    freshRequest.acceptanceFinalized = true;
    await freshRequest.save();

    // Prevent duplicates using $addToSet
    await Hospital.findByIdAndUpdate(request.hospital, {
      $addToSet: {
        donorResponses: {
          donorId: donorDoc.donorId,
          donorName: donorDoc.personalDetails.firstName,
          donorCity: donorDoc.personalDetails.city,
          donorAge: donorDoc.personalDetails.age,
          donorPhone: donorDoc.personalDetails.phone,
          requestId: request._id,
          organNeeded: request.organNeeded,
          urgency: request.urgency,
          status: "accepted",
          createdAt: new Date(),
        },
        pendingNotifications: {
          donorId: donorDoc.donorId,
          donorName: donorDoc.personalDetails.firstName,
          donorCity: donorDoc.personalDetails.city,
          donorAge: donorDoc.personalDetails.age,
          donorPhone: donorDoc.personalDetails.phone,
          requestId: request._id,
          organNeeded: request.organNeeded,
          urgency: request.urgency,
          status: "accepted",
          createdAt: new Date(),
        }
      }
    });

    io.to(request.hospital.toString()).emit("donorResponse", {
      donorId: donorDoc.donorId,
      donorName: donorDoc.personalDetails.firstName,
      donorCity: donorDoc.personalDetails.city,
      donorAge: donorDoc.personalDetails.age,
      donorPhone: donorDoc.personalDetails.phone,
      requestId: request._id,
      organNeeded: request.organNeeded,
      urgency: request.urgency,
      status: "accepted",
    });
  } catch (err) {
    console.error("Error handling donor acceptance:", err);
  }
}

// Handle donor rejection or timeout and notify hospital
async function handleDonorRejection(io, donorDoc, request, status = "declined") {
  try {
    const freshRequest = await OrganRequest.findById(request._id);
    if (!freshRequest) {
      console.warn(`handleDonorRejection: request ${request._id} not found`);
      return;
    }
    if (freshRequest.acceptanceFinalized) return;

    await Hospital.findByIdAndUpdate(request.hospital, {
      $addToSet: {
        donorResponses: {
          donorId: donorDoc.donorId,
          donorName: donorDoc.personalDetails.firstName,
          donorCity: donorDoc.personalDetails.city,
          donorAge: donorDoc.personalDetails.age,
          donorPhone: donorDoc.personalDetails.phone,
          requestId: request._id,
          organNeeded: request.organNeeded,
          urgency: request.urgency,
          status,
          createdAt: new Date(),
        },
        pendingNotifications: {
          donorId: donorDoc.donorId,
          donorName: donorDoc.personalDetails.firstName,
          donorCity: donorDoc.personalDetails.city,
          donorAge: donorDoc.personalDetails.age,
          donorPhone: donorDoc.personalDetails.phone,
          requestId: request._id,
          organNeeded: request.organNeeded,
          urgency: request.urgency,
          status,
          createdAt: new Date(),
        }
      }
    });

    io.to(request.hospital.toString()).emit("donorResponse", {
      donorId: donorDoc.donorId,
      donorName: donorDoc.personalDetails.firstName,
      donorCity: donorDoc.personalDetails.city,
      donorAge: donorDoc.personalDetails.age,
      donorPhone: donorDoc.personalDetails.phone,
      requestId: request._id,
      organNeeded: request.organNeeded,
      urgency: request.urgency,
      status,
    });
  } catch (err) {
    console.error("Error handling donor rejection:", err);
  }
}

// Main route for creating organ/blood request
const createOrganRequest = (io) => {
  router.post("/", async (req, res) => {
    try {
      const { patientId, hospital, organNeeded, urgency, notes, status } = req.body;

      const existingRequest = await OrganRequest.findOne({
        patient: patientId,
        organNeeded: organNeeded || "Blood",
        status: { $in: ["pending", "accepted"] },
      });
      if (existingRequest) {
        return res.status(400).json({
          message: "Organ request already exists for this patient and organ.",
        });
      }

      let request = new OrganRequest({
        patient: patientId,
        hospital,
        organNeeded: organNeeded || "Blood",
        urgency,
        notes,
        status: status || "pending",
      });
      await request.save();

      request = await request.populate({
        path: "patient",
        select: "name age bloodGroup email phone",
      });
      request = await request.populate({
        path: "hospital",
        select: "hospitalName city",
      });

      const populatedRequest = request.toObject();
      const matches = await matchDonors({
        organNeeded: organNeeded,
        patientAge: Number(request.patient.age),
        bloodGroup: request.patient.bloodGroup,
        city: request.hospital.city,
        type: organNeeded ? "Organ" : "Blood",
        urgency: urgency.toLowerCase(),
      });

      request.matchedDonors = matches;
      await request.save();

      res.status(201).json({
        message: "Organ/Blood request created & AI matching started",
        request: populatedRequest,
        matches,
      });

      // Donor notification loop
      (async () => {
        try {
          const uniqueMatches = Array.from(new Map(matches.map(d => [d.donorId, d])).values());

          for (let i = 0; i < uniqueMatches.length; i++) {
            const donor = uniqueMatches[i];
            if (!donor?.donorId) continue;

            console.log(`Sending request notification to donor: ${donor.name || donor.donorId}`);

            const donorDoc = await Donor.findOne({ donorId: donor.donorId });
            if (!donorDoc) continue;

            const alreadyPending = donorDoc.pendingNotifications?.some(
              n => n.requestId.toString() === request._id.toString()
            );

            const notification = {
              requestId: request._id,
              organNeeded: request.organNeeded || "N/A",
              urgency: request.urgency,
              hospitalName: request.hospital.hospitalName,
              hospitalCity: request.hospital.city,
              status: request.status,
              createdAt: new Date(),
            };

            // ✅ Update donor's currentRequest before notifying
            await Donor.findOneAndUpdate(
              { donorId: donor.donorId },
              { currentRequest: { requestId: request._id, organNeeded: request.organNeeded, urgency: request.urgency } }
            );

            if (!alreadyPending) {
              await Donor.findOneAndUpdate(
                { donorId: donor.donorId },
                { $addToSet: { pendingNotifications: notification } }
              );
            }

            const donorRoom = io.sockets.adapter.rooms.get(donor.donorId);
            if (donorRoom) io.to(donor.donorId).emit("newOrganRequest", notification);

            // Wait for donor response
            const donorStatus = await waitForDonorResponse(io, donor.donorId, request._id, DONOR_RESPONSE_TIMEOUT);

            // Fetch latest request
            const freshRequest = await OrganRequest.findById(request._id);
            if (!freshRequest) {
              console.warn(`Main notification loop: request ${request._id} not found (may have been deleted). Skipping donor ${donor.donorId}.`);
              // Clear donor's currentRequest before continuing
              await Donor.findOneAndUpdate(
                { donorId: donor.donorId },
                { $unset: { currentRequest: "" } }
              );
              continue;
            }

            // ✅ Update currentDonorIndex and donorResponses
            freshRequest.currentDonorIndex = i;
            freshRequest.donorResponses = freshRequest.donorResponses || [];
            freshRequest.donorResponses.push({
              donorId: donor.donorId,
              status: donorStatus,
              respondedAt: new Date(),
            });
            await freshRequest.save();

            // Clear donor's currentRequest after response
            await Donor.findOneAndUpdate(
              { donorId: donor.donorId },
              { $unset: { currentRequest: "" } }
            );

            if (freshRequest.acceptanceFinalized) {
              console.log(`Request ${request._id} already finalized. Stopping donor notifications.`);
              io.to(donor.donorId).emit("requestAlreadyFinalized", { requestId: request._id });
              break;
            }

            if (donorStatus === "accepted") {
              io.to(donor.donorId).emit("acceptConfirmation", { requestId: request._id });

              const confirmed = await new Promise((resolve) => {
                const acceptEvent = `accept_confirmed_${donor.donorId}_${request._id}`;
                const cancelEvent = `accept_cancelled_${donor.donorId}_${request._id}`;

                const onConfirmed = () => {
                  clearTimeout(timeout);
                  io.off(acceptEvent, onConfirmed);
                  io.off(cancelEvent, onCancelled);
                  resolve(true);
                };

                const onCancelled = () => {
                  clearTimeout(timeout);
                  io.off(acceptEvent, onConfirmed);
                  io.off(cancelEvent, onCancelled);
                  resolve(false);
                };

                const timeout = setTimeout(() => {
                  io.off(acceptEvent, onConfirmed);
                  io.off(cancelEvent, onCancelled);
                  resolve(false);
                }, 60000);

                io.once(acceptEvent, onConfirmed);
                io.once(cancelEvent, onCancelled);
              });

              if (confirmed) {
                await handleDonorAcceptance(io, donorDoc, freshRequest);
                await Donor.findOneAndUpdate(
                  { donorId: donor.donorId },
                  { $pull: { pendingNotifications: { requestId: request._id } } }
                );
                break; // stop notifying other donors
              } else {
                await handleDonorRejection(io, donorDoc, freshRequest, "cancelled");
                // Log the next eligible donor after a cancellation
                {
                  const nextMatch = uniqueMatches.slice(i + 1).find(m => m && m.donorId);
                  if (nextMatch) {
                    console.log(`Donor ${donor.donorId} cancelled — next eligible donor: ${nextMatch.name || nextMatch.donorId}`);
                  } else {
                    console.log(`Donor ${donor.donorId} cancelled — no more eligible donors`);
                  }
                }
              }
            } else if (donorStatus === "rejected" || donorStatus === "timeout") {
              await handleDonorRejection(io, donorDoc, freshRequest, donorStatus);
              // Log the next eligible donor after rejection/timeout
              {
                const nextMatch = uniqueMatches.slice(i + 1).find(m => m && m.donorId);
                if (nextMatch) {
                  console.log(`Donor ${donor.donorId} ${donorStatus} — next eligible donor: ${nextMatch.name || nextMatch.donorId}`);
                } else {
                  console.log(`Donor ${donor.donorId} ${donorStatus} — no more eligible donors`);
                }
              }
            }
          }
        } catch (err) {
          console.error("Error in donor notification loop:", err);
        }
      })();

    } catch (err) {
      console.error("Error creating organ/blood request:", err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Server error", error: err.message });
      }
    }
  });

  // Fetch all requests by hospital
  router.get("/hospital/:hospitalId", async (req, res) => {
    try {
      const requests = await OrganRequest.find({ hospital: req.params.hospitalId })
        .populate("patient", "name age bloodGroup email phone")
        .sort({ createdAt: -1 });
      res.json({ requests });
    } catch (err) {
      console.error("Error fetching organ requests:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get all organ requests for a hospital with patient info
  router.get("/hospital/:hospitalId/organ-list", async (req, res) => {
    try {
      const { hospitalId } = req.params;

      const requests = await OrganRequest.find({ hospital: hospitalId })
        .populate("patient", "name age bloodGroup email phone")
        .sort({ createdAt: -1 });

      const organList = requests.map(req => ({
        requestId: req._id,
        patientName: req.patient.name,
        organNeeded: req.organNeeded,
        urgency: req.urgency,
        status: req.status,
        createdAt: req.createdAt
      }));

      res.json({ organList });
    } catch (err) {
      console.error("Error fetching organ list:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete organ request by ID
  router.delete("/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;

      const deletedRequest = await OrganRequest.findByIdAndDelete(requestId);
      if (!deletedRequest) {
        return res.status(404).json({ message: "Organ request not found" });
      }

      if (deletedRequest.hospital) {
        io.to(deletedRequest.hospital.toString()).emit("organRequestDeleted", { requestId });
      }

      res.json({ message: "Organ request deleted successfully" });
    } catch (err) {
      console.error("Error deleting organ request:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // GET pending notifications for a hospital
  router.get("/:hospitalId/pending-notifications", async (req, res) => {
    try {
      const { hospitalId } = req.params;
      const hospital = await Hospital.findById(hospitalId);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }
      res.json({ notifications: hospital.pendingNotifications || [] });
    } catch (err) {
      console.error("Error fetching pending notifications:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  router.post("/:hospitalId/pending-notifications/clear", async (req, res) => {
  const { hospitalId } = req.params;
  const { requestId } = req.body;
  try {
    const query = mongoose.Types.ObjectId.isValid(hospitalId)
      ? { _id: hospitalId }
      : { hospitalId };

    await Hospital.updateOne(query, { $pull: { pendingNotifications: { requestId } } });
    res.json({ message: "Pending notification cleared" });
  } catch (err) {
    console.error("Error clearing pending notifications:", err);
    res.status(500).json({ message: "Server error" });
  }
});

  return router;
};

module.exports = createOrganRequest;
