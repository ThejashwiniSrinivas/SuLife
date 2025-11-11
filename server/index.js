// index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const Donor = require("./models/Donor");
const OrganRequest = require("./models/OrganRequest");
const Hospital = require("./models/Hospital");
const adminRoutes = require("./routes/adminRoutes");
const donorRoutes = require("./routes/donorRoutes.js");
const hospitalRoutes = require("./routes/hospitalRoutes.js");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");
const organRequestRoutes = require("./routes/organRequestRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------
// MongoDB Connection
// ----------------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// ----------------------
// Socket.io Setup
// ----------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  // ----------------------
  // Donor joins their room
  // ----------------------
  socket.on("join", async ({ donorId }) => {
    try {
      if (!donorId) {
        console.error("❌ [join] donorId is undefined. Cannot join room.");
        return;
      }
      socket.join(donorId);
      console.log(`🟦 Donor joined room: ${donorId} (socket ${socket.id})`);

      // Send any pending notifications from DB
      const donor = await Donor.findOne({ donorId }).lean();
      if (donor?.pendingNotifications?.length > 0) {
        console.log(`📬 Sending ${donor.pendingNotifications.length} pending notifications to donor ${donorId}`);
        donor.pendingNotifications.forEach((notif) => {
          io.to(donorId).emit("newOrganRequest", notif);
        });

        // Clear pendingNotifications (we do a direct update to avoid concurrency surprises)
        await Donor.updateOne({ donorId }, { $set: { pendingNotifications: [] } });
        console.log(`✅ Cleared pending notifications for donor ${donorId} in DB`);
      }
    } catch (err) {
      console.error("❌ [join] Error sending pending notifications to donor:", err && err.stack ? err.stack : err);
    }
  });

  // ----------------------
  // Hospital joins its room
  // ----------------------
  socket.on("hospital_join", async ({ hospitalId }) => {
    try {
      if (!hospitalId) {
        console.error("❌ [hospital_join] hospitalId is undefined. Cannot join room.");
        return;
      }
      const roomId = hospitalId.toString();
      socket.join(roomId);
      console.log(`🟪 Hospital joined room: ${roomId} (socket ${socket.id})`);

      // Acknowledge join to hospital client
      socket.emit("join_ack", { hospitalId: roomId });

      // Send any pending notifications stored in DB
      const hospital = await Hospital.findById(roomId).lean();
      if (hospital?.pendingNotifications?.length > 0) {
        console.log(`📬 Sending ${hospital.pendingNotifications.length} pending notifications to hospital ${roomId}`);
        hospital.pendingNotifications.forEach(notif => {
          io.to(roomId).emit("donorResponse", notif);
        });
        // NOTE: we are NOT clearing pendingNotifications here to preserve history.
        console.log(`ℹ️ Left pendingNotifications intact for hospital ${roomId} (so dashboard can re-fetch)`);
      }
    } catch (err) {
      console.error("❌ [hospital_join] Error sending pending notifications to hospital:", err && err.stack ? err.stack : err);
    }
  });

  // ----------------------
  // Donor accepted a request (Option 2 - no transaction)
  // ----------------------
  socket.on("accept_request", async ({ donorId, requestId }) => {
    console.log(`➡️ [accept_request] received donorId=${donorId}, requestId=${requestId}`);
    if (!donorId || !requestId) {
      console.error("❌ [accept_request] donorId or requestId missing");
      return;
    }

    try {
      // Fetch OrganRequest and Donor
      const request = await OrganRequest.findById(requestId).populate("hospital");
      if (!request) throw new Error(`[accept_request] OrganRequest ${requestId} not found`);

      const donor = await Donor.findOne({ donorId });
      if (!donor) throw new Error(`[accept_request] Donor ${donorId} not found`);

      if (!request.hospital) throw new Error(`[accept_request] OrganRequest ${requestId} has no hospital associated`);

      if (request.acceptanceFinalized) {
        console.warn(`[accept_request] Request ${requestId} already accepted - skipping`);
        return;
      }

      // ----------------------
      // Update OrganRequest
      // ----------------------
      request.acceptanceFinalized = true;
      request.acceptedDonor = {
        donorId: donor.donorId,
        name: donor.personalDetails.firstName + " " + donor.personalDetails.lastName,
        phone: donor.personalDetails.phone,
        city: donor.personalDetails.city,
      };
      request.status = "accepted";
      request.donorResponses = request.donorResponses || [];
      request.donorResponses.push({
        donorId: donor.donorId,
        status: "accepted",
        notifiedAt: new Date(),
        respondedAt: new Date()
      });
      await request.save();

      // ----------------------
      // Build notification payload
      // ----------------------
      const donorResponseData = {
        donorId: donor.donorId,
        donorName: donor.personalDetails.firstName + " " + donor.personalDetails.lastName,
        donorAge: donor.personalDetails.age,
        donorPhone: donor.personalDetails.phone,
        donorCity: donor.personalDetails.city,
        organNeeded: request.organNeeded,
        urgency: request.urgency,
        requestId: request._id.toString(),
        status: "accepted",
        createdAt: new Date(),
      };

      // ----------------------
      // Update Hospital
      // ----------------------
      const hospital = await Hospital.findById(request.hospital._id);
      if (!hospital) throw new Error(`[accept_request] Hospital ${request.hospital._id} not found`);

      hospital.donorResponses = hospital.donorResponses || [];
      hospital.donorResponses.push({
        donorId: donor.donorId,
        donorName: donorResponseData.donorName,
        donorCity: donorResponseData.donorCity,
        donorAge: donorResponseData.donorAge,
        donorPhone: donorResponseData.donorPhone,
        requestId: request._id,
        organNeeded: request.organNeeded,
        urgency: request.urgency,
        status: "accepted",
        createdAt: new Date()
      });

      hospital.pendingNotifications = hospital.pendingNotifications || [];
      hospital.pendingNotifications.push({
        donorId: donor.donorId,
        donorName: donorResponseData.donorName,
        donorCity: donorResponseData.donorCity,
        donorAge: donorResponseData.donorAge,
        donorPhone: donorResponseData.donorPhone,
        requestId: request._id,
        organNeeded: request.organNeeded,
        urgency: request.urgency,
        status: "accepted",
        createdAt: new Date()
      });

      await hospital.save();

      // ----------------------
      // Update donor's currentRequest (optional)
      // ----------------------
      await Donor.updateOne(
        { donorId },
        {
          $set: {
            "currentRequest.requestId": request._id,
            "currentRequest.status": "accepted",
            "currentRequest.notifiedAt": new Date()
          }
        }
      );

      // ----------------------
      // Emit to hospital room
      // ----------------------
      const hospitalRoom = request.hospital._id.toString();
      io.to(hospitalRoom).emit("donorResponse", donorResponseData);
      console.log(`✅ [accept_request] DB updated and emitted donorResponse to hospital ${hospitalRoom}`);
    } catch (err) {
      console.error("❌ [accept_request] Error:", err && err.stack ? err.stack : err);
    }
  });

  // ----------------------
  // Donor rejected a request or timed out
  // ----------------------
  socket.on("reject_request", async ({ donorId, requestId }) => {
    console.log(`➡️ [reject_request] received donorId=${donorId}, requestId=${requestId}`);
    if (!donorId || !requestId) {
      console.error("❌ [reject_request] donorId or requestId missing");
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const request = await OrganRequest.findById(requestId).session(session).populate("hospital");
      if (!request) {
        throw new Error(`[reject_request] OrganRequest ${requestId} not found`);
      }
      const donor = await Donor.findOne({ donorId }).session(session);
      if (!donor) {
        throw new Error(`[reject_request] Donor ${donorId} not found`);
      }
      if (!request.hospital) {
        throw new Error(`[reject_request] OrganRequest ${requestId} has no hospital associated`);
      }

      // Build rejection payload
      const donorResponseData = {
        donorId: donor.donorId,
        donorName: donor.personalDetails.firstName + " " + donor.personalDetails.lastName,
        donorAge: donor.personalDetails.age,
        donorPhone: donor.personalDetails.phone,
        donorCity: donor.personalDetails.city,
        organNeeded: request.organNeeded,
        urgency: request.urgency,
        requestId: request._id.toString(),
        status: "rejected",
        createdAt: new Date(),
      };

      // Update OrganRequest donorResponses
      request.donorResponses = request.donorResponses || [];
      request.donorResponses.push({
        donorId: donor.donorId,
        status: "rejected",
        notifiedAt: new Date(),
        respondedAt: new Date()
      });

      // Save request (we may update currentDonorIndex below)
      await request.save({ session });

      // Update Hospital history & pending notifications
      const hospital = await Hospital.findById(request.hospital._id).session(session);
      if (!hospital) {
        throw new Error(`[reject_request] Hospital ${request.hospital._id} not found`);
      }

      hospital.donorResponses = hospital.donorResponses || [];
      hospital.donorResponses.push({
        donorId: donor.donorId,
        donorName: donorResponseData.donorName,
        donorCity: donorResponseData.donorCity,
        donorAge: donorResponseData.donorAge,
        donorPhone: donorResponseData.donorPhone,
        requestId: request._id,
        organNeeded: request.organNeeded,
        urgency: request.urgency,
        status: "rejected",
        createdAt: new Date()
      });

      // Optionally store a pendingNotification about the rejection (so dashboard can show it)
      hospital.pendingNotifications = hospital.pendingNotifications || [];
      hospital.pendingNotifications.push({
        donorId: donor.donorId,
        donorName: donorResponseData.donorName,
        donorCity: donorResponseData.donorCity,
        donorAge: donorResponseData.donorAge,
        donorPhone: donorResponseData.donorPhone,
        requestId: request._id,
        organNeeded: request.organNeeded,
        urgency: request.urgency,
        status: "rejected",
        createdAt: new Date()
      });

      await hospital.save({ session });

      // If accept not finalized, advance to next donor and notify them (DB + socket)
      if (!request.acceptanceFinalized) {
        const nextIndex = (request.currentDonorIndex || 0) + 1;
        if (nextIndex < (request.matchedDonors?.length || 0)) {
          const nextDonorEntry = request.matchedDonors[nextIndex];
          request.currentDonorIndex = nextIndex;
          await request.save({ session });

          // Save pending notification for next donor in DB (if donor exists)
          if (nextDonorEntry?.donorId) {
            const nextDonorDoc = await Donor.findOne({ donorId: nextDonorEntry.donorId }).session(session);
            const notifForNext = {
              requestId: request._id,
              organNeeded: request.organNeeded,
              urgency: request.urgency,
              hospitalName: request.hospital.hospitalName,
              hospitalCity: request.hospital.city,
              createdAt: new Date()
            };
            if (nextDonorDoc) {
              nextDonorDoc.pendingNotifications = nextDonorDoc.pendingNotifications || [];
              nextDonorDoc.pendingNotifications.push(notifForNext);
              await nextDonorDoc.save({ session });
              console.log(`📨 Saved pending notification for next donor ${nextDonorEntry.donorId}`);
            }

            // Emit to next donor if connected
            io.to(nextDonorEntry.donorId).emit("newOrganRequest", {
              requestId: request._id.toString(),
              organNeeded: request.organNeeded,
              urgency: request.urgency,
              hospitalName: request.hospital.hospitalName,
              hospitalCity: request.hospital.city,
            });
            console.log(`🔔 Emitted newOrganRequest to next donor ${nextDonorEntry.donorId}`);
          } else {
            console.warn(`[reject_request] nextDonorEntry has no donorId: ${JSON.stringify(nextDonorEntry)}`);
          }
        } else {
          console.log(`[reject_request] No next donor available for request ${request._id}`);
        }
      }

      await session.commitTransaction();
      session.endSession();

      // Emit rejection to hospital room AFTER commit
      const hospitalRoom = request.hospital._id.toString();
      io.to(hospitalRoom).emit("donorResponse", donorResponseData);
      console.log(`✅ [reject_request] DB updated and emitted donorResponse (rejection) to hospital ${hospitalRoom}`);
    } catch (err) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (e) {
        console.error("❌ [reject_request] Error aborting session:", e && e.stack ? e.stack : e);
      }
      console.error("❌ [reject_request] Error:", err && err.stack ? err.stack : err);
    }
  });

  // ----------------------
  // Accept confirmed/cancelled events - kept for compatibility
  // ----------------------
  socket.on("accept_confirmed", ({ donorId, requestId }) => {
    console.log(`ℹ️ [accept_confirmed] donor ${donorId} for request ${requestId}`);
    io.emit(`accept_confirmed_${donorId}_${requestId}`);
  });

  socket.on("accept_cancelled", ({ donorId, requestId }) => {
    console.log(`ℹ️ [accept_cancelled] donor ${donorId} for request ${requestId}`);
    io.emit(`accept_cancelled_${donorId}_${requestId}`);
  });

  // ----------------------
  // Hospital logout event (clear pending notifications)
  // ----------------------
  socket.on("hospital_logout", async ({ hospitalId }) => {
    try {
      if (!hospitalId) {
        console.error("❌ [hospital_logout] No hospitalId provided for logout");
        return;
      }
      const hospital = await Hospital.findById(hospitalId);
      if (!hospital) {
        console.error("❌ [hospital_logout] Hospital not found for logout:", hospitalId);
        return;
      }
      hospital.pendingNotifications = [];
      await hospital.save();
      console.log(`🧹 [hospital_logout] Cleared pending notifications for hospital: ${hospitalId}`);
    } catch (err) {
      console.error("❌ [hospital_logout] Error clearing hospital notifications on logout:", err && err.stack ? err.stack : err);
    }
  });

  // ----------------------
  // Donor logout event (clear pending notifications)
  // ----------------------
  socket.on("donor_logout", async ({ donorId }) => {
    try {
      if (!donorId) {
        console.error("❌ [donor_logout] No donorId provided for logout");
        return;
      }
      const donor = await Donor.findOne({ donorId });
      if (!donor) {
        console.error("❌ [donor_logout] Donor not found for logout:", donorId);
        return;
      }
      donor.pendingNotifications = [];
      await donor.save();
      console.log(`🧹 [donor_logout] Cleared pending notifications for donor: ${donorId}`);
    } catch (err) {
      console.error("❌ [donor_logout] Error clearing donor notifications on logout:", err && err.stack ? err.stack : err);
    }
  });

  // ----------------------
  // Disconnect handler
  // ----------------------
  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// Make io available in routes
app.set("io", io);

// Routes (organRequestRoutes receives io so it can emit if needed in controllers)
app.use("/api/organ-requests", organRequestRoutes(io));
app.use("/api/donors", donorRoutes);
app.use("/api/hospital", hospitalRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/admin", adminRoutes);
// Landing route
app.get("/", (req, res) =>
  res.send("Welcome to SuLife - AI enabled Organ & Blood Donation System")
);

// Start server
mongoose.connection.once('open', () => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
});
