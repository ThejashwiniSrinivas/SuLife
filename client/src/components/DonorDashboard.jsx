import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./DonorDashboard.css";
import bgImage from "../assets/organbg.png";
import Navbar from "./Navbar";
import axios from "axios";
import { FaUser, FaSignOutAlt, FaBell } from "react-icons/fa";
import { FaNotesMedical } from "react-icons/fa6";
import { MdAssignment, MdHealthAndSafety } from "react-icons/md";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const mergeRequests = (existing, incoming) => {
  const map = new Map();
  [...existing, ...incoming].forEach(req => {
    map.set(req.requestId, req);
  });
  return Array.from(map.values());
};
const mergeByRequestId = (arr1, arr2) => {
  const map = new Map();
  [...arr1, ...arr2].forEach(item => item && map.set(item.requestId, item));
  return Array.from(map.values());
};
const DonorDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [showNomineeReminder, setShowNomineeReminder] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [livingOrgans, setLivingOrgans] = useState([]);
  const [posthumousOrgans, setPosthumousOrgans] = useState([]);
  const [socket, setSocket] = useState(null);
  const [bloodDonation, setBloodDonation] = useState(false);
  const [donationHistory, setDonationHistory] = useState([]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const donorId = localStorage.getItem("donorId");
  const voicedRequestsRef = React.useRef(new Set());
  const handleAccept = async (requestId) => {
    try {
      if (!socket) return;
      socket.emit("accept_request", { requestId, donorId });
      await axios.post(`http://localhost:5000/api/donors/${donorId}/notifications/clear`, { requestId });
      setNotifications(prev => {
        const updated = prev.filter(n => n.requestId !== requestId);
        localStorage.setItem('donor_notifications', JSON.stringify(updated));
        if (requestId) voicedRequestsRef.current.delete(requestId.toString());
        return updated;
      });
      const acceptedRequest = requests.find(r => r.requestId === requestId);
      const hospitalName = acceptedRequest?.hospitalName || "the hospital";
      toast.success(`Your acceptance is notified to "${hospitalName}". Thank you for your willingness to donate!`);
    } catch (err) {
      console.error("Error accepting request:", err);
      toast.error("Failed to accept request. Please try again.");
    }
  };
  const handleReject = async (requestId) => {
    try {
      if (!socket) return;
      socket.emit("reject_request", { requestId, donorId });
      await axios.post(`http://localhost:5000/api/donors/${donorId}/notifications/clear`, { requestId });
      setNotifications(prev => {
        const updated = prev.filter(n => n.requestId !== requestId);
        localStorage.setItem('donor_notifications', JSON.stringify(updated));
        if (requestId) voicedRequestsRef.current.delete(requestId.toString());
        return updated;
      });
      toast.info("You have declined the organ request.");
    } catch (err) {
      console.error("Error rejecting request:", err);
      toast.error("Failed to decline request. Please try again.");
    }
  };
  const dummyAiTips = `
💡 Drink plenty of water daily.
💡 Eat fruits and vegetables for better immunity.
💡 Exercise at least 30 mins a day.
💡 Get regular check-ups.
💡 Avoid smoking and excess alcohol.
`;
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  const [errors, setErrors] = useState({});
  const normalizeRequest = (item) => ({
    requestId: item.requestId ? item.requestId.toString() : '',
    hospitalName: item.hospitalName || "Unknown",
    hospitalCity: item.hospitalCity || "Unknown",
    urgency: item.urgency || "Not specified",
    status: (typeof item.status === "string" && item.status.trim()) ? item.status : "Pending",
    organNeeded: item.organNeeded || "N/A",
    date: (typeof item.date === "string" && item.date.trim())
      ? item.date
      : (item.date ? new Date(item.date).toLocaleString() : new Date().toLocaleString())
  });
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/donors/${donorId}`);
        const donor = res.data;
        const mappedProfile = {
          fullName:
            (donor.personalDetails?.firstName || "") +
            (donor.personalDetails?.lastName ? " " + donor.personalDetails.lastName : ""),
          donorId: donor.donorId,
          bloodType: donor.medicalDetails?.bloodGroup || "",
          email: donor.personalDetails?.email || "",
          phone: donor.personalDetails?.phone || "",
          addressLine1: donor.personalDetails?.addressLine1 || "",
          addressLine2: donor.personalDetails?.addressLine2 || "",
          city: donor.personalDetails?.city || "",
          state: donor.personalDetails?.state || "",
          pincode: donor.personalDetails?.pincode || "",
          nomineeName: donor.nomineeDetails?.name || "",
          nomineeRelation: donor.nomineeDetails?.relation || "",
          nomineePhone: donor.nomineeDetails?.phone || "",
          nomineeEmail: donor.nomineeDetails?.email || "",
          nomineeAddress: donor.nomineeDetails?.address || "",
          livingOrgans: donor.donationType?.livingOrgans || [],
          posthumousOrgans: donor.donationType?.posthumousOrgans || [],
          bloodAgreed: donor.donationType?.blood?.agreed || false,
          lastBloodDonation: donor.donationType?.blood?.lastDonationDate || null,
        };
        setProfile(mappedProfile);
        setFormData(mappedProfile);
        setLivingOrgans(mappedProfile.livingOrgans);
        setPosthumousOrgans(mappedProfile.posthumousOrgans);
        setBloodDonation(mappedProfile.bloodAgreed);
      } catch (err) {
        console.error("❌ Error fetching donor profile:", err);
      }
    };
    if (donorId) fetchProfile();
  }, [donorId]);
  const handleNewNotifications = (incomingArr) => {
    const normalized = incomingArr.map(normalizeRequest);
    setNotifications(prev => {
      const map = new Map();
      [...prev, ...normalized].forEach(n => map.set(n.requestId.toString(), n));
      return Array.from(map.values());
    });
    setRequests(prev => {
      const map = new Map();
      [...prev, ...normalized].forEach(r => map.set(r.requestId.toString(), r));
      return Array.from(map.values());
    });
  };
  useEffect(() => {
    const loadFromLocalStorage = () => {
      if (notifications.length === 0) { // only load if empty
        const stored = localStorage.getItem('donor_notifications');
        if (stored) {
          const parsed = JSON.parse(stored);
          const normalized = parsed.map(normalizeRequest);
          handleNewNotifications(normalized);
        }
      }
    };
    loadFromLocalStorage();
  }, []);
  useEffect(() => {
    if (!donorId || !profile) return;
    const socket = io("http://localhost:5000");

    const onNewRequest = (data) => {
      const normalizedRequest = normalizeRequest(data);
      const idStr = normalizedRequest.requestId;
      let newNotificationAdded = false;

      setRequests(prevRequests => {
        // Check duplicate requestId
        if (prevRequests.some(r => r.requestId === idStr)) return prevRequests;

        setNotifications(prevNotifications => {
          // Check duplicate notificationId
          if (prevNotifications.some(n => n.requestId === idStr)) return prevNotifications;

          newNotificationAdded = true;

          const updatedNotifications = [...prevNotifications, normalizedRequest];
          localStorage.setItem('donor_notifications', JSON.stringify(updatedNotifications));

          return updatedNotifications;
        });

        return [...prevRequests, normalizedRequest];
      });

      // Play voice only once per batch
      if (newNotificationAdded) {
        const greeting = getGreeting();
        const message = `${greeting}, ${profile?.fullName || "Donor"}, you have a new organ request. Please check the Requests tab.`;
        try {
          const msg = new SpeechSynthesisUtterance(message);
          window.speechSynthesis.speak(msg);
        } catch (e) {
          console.debug("Speech synthesis unavailable", e);
        }
      }
    };

    socket.on("newOrganRequest", onNewRequest);
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      socket.emit("join", { donorId });
    });
    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });

    // Add this listener for accept confirmation
    socket.on("acceptConfirmation", (data) => {
      if (window.confirm("Do you want to confirm acceptance of this request?")) {
        socket.emit("accept_confirmed", { requestId: data.requestId, donorId });
        toast.success("Acceptance confirmed.");
      } else {
        socket.emit("accept_cancelled", { requestId: data.requestId, donorId });
        toast.info("Acceptance cancelled.");
      }
    });

    setSocket(socket);

    return () => {
      socket.off("newOrganRequest", onNewRequest);
      socket.off("acceptConfirmation");
      socket.disconnect();
      console.log("🧹 Socket disconnected cleanup");
    };
  }, [donorId, profile?.donorId]);

  useEffect(() => {
    const fetchPending = async () => {
      if (!profile || !profile.fullName) return;
      try {
        const res = await axios.get(`http://localhost:5000/api/donors/${donorId}/notifications`);

        if (res.data.notifications?.length) {
          const normalized = res.data.notifications.map(item => ({
            requestId: item?.requestId ? item.requestId.toString() : '',
            hospitalName: item?.hospitalName || "Unknown",
            hospitalCity: item?.hospitalCity || "Unknown",
            urgency: item?.urgency || "Not specified",
            status: (typeof item?.status === "string" && item.status.trim()) ? item.status : "Pending",
            organNeeded: item?.organNeeded || "N/A",
            date: (typeof item?.date === "string" && item.date.trim())
              ? item.date
              : (item?.date ? new Date(item.date).toLocaleString() : new Date().toLocaleString()),
          }));
          const newOnes = normalized.filter(
            n => !requests.some(r => r.requestId.toString() === n.requestId.toString())
          );
          if (newOnes.length > 0) {
            const combinedNotifications = mergeRequests(notifications, newOnes);
            setNotifications(combinedNotifications);
            const combinedRequests = mergeRequests(requests, newOnes);
            setRequests(combinedRequests);
            localStorage.setItem("donor_notifications", JSON.stringify(combinedNotifications));
          }
          toast.info(`${getGreeting()}, ${profile.fullName}, you have new organ requests. Please check the Requests tab.`, {
            position: "top-right",
            autoClose: 8500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "colored",
            icon: "✨",
            style: {
              borderRadius: "16px",
              background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
              color: "#ffffff",
              fontWeight: "700",
              fontSize: "16px",
              padding: "18px 26px",
              boxShadow: "0 8px 24px rgba(101, 118, 255, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(10px)",
              letterSpacing: "0.4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
              transform: "scale(1)",
            },
            onOpen: (toast) => {
              if (!toast || !toast.id) return;
              const el = document.getElementById(toast.id);
              if (el) {
                el.animate(
                  [
                    { transform: "scale(0.9)", opacity: 0 },
                    { transform: "scale(1.05)", opacity: 1 },
                    { transform: "scale(1)", opacity: 1 },
                  ],
                  { duration: 500, easing: "ease-out" }
                );
                el.style.boxShadow = "0 0 20px rgba(101, 118, 255, 0.6)";
              }
            },
            onClose: (toast) => {
              if (!toast || !toast.id) return;
              const el = document.getElementById(toast.id);
              if (el) {
                el.animate(
                  [
                    { transform: "scale(1)", opacity: 1 },
                    { transform: "scale(0.9)", opacity: 0 },
                  ],
                  { duration: 300, easing: "ease-in" }
                );
              }
            },
          });
        }
      } catch (err) {
        console.error("❌ Error fetching pending notifications:", err);
      }
    };
    if (profile && profile.fullName) {
      fetchPending();
    }
  }, [profile, donorId]);


  useEffect(() => {
    const nomineeIncomplete =
      !formData?.nomineeName?.trim() ||
      !formData?.nomineeRelation?.trim() ||
      !formData?.nomineePhone?.trim() ||
      !formData?.nomineeAddress?.trim();
    if (posthumousOrgans.length > 0 && nomineeIncomplete) {
      setShowNomineeReminder(true);
    } else {
      setShowNomineeReminder(false);
    }
  }, [posthumousOrgans]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleLivingOrgansChange = (index, value) => {
    const updated = [...livingOrgans];
    updated[index] = value;
    setLivingOrgans(updated);
  };
  const handlePosthumousOrgansChange = (index, value) => {
    const updated = [...posthumousOrgans];
    updated[index] = value;
    setPosthumousOrgans(updated);

    if (value.toLowerCase().includes("posthumous")) {
      setShowNomineeReminder(true);
    } else {
      setShowNomineeReminder(false);
    }
  };
  const addLivingOrgan = () => setLivingOrgans([...livingOrgans, ""]);
  const removeLivingOrgan = (index) => {
    const updated = [...livingOrgans];
    updated.splice(index, 1);
    setLivingOrgans(updated);
  };
  const addPosthumousOrgan = () => setPosthumousOrgans([...posthumousOrgans, ""]);
  const removePosthumousOrgan = (index) => {
    const updated = [...posthumousOrgans];
    updated.splice(index, 1);
    setPosthumousOrgans(updated);
  };

  const handleSave = async () => {
    if (!validateProfileAndNominee()) {
      alert("Please fill the nominee details before saving.");
      return;
    }
    try {
      const [firstName, ...rest] = formData.fullName.split(" ");
      const lastName = rest.join(" ");
      const updatedData = {
        personalDetails: {
          firstName,
          lastName,
          email: formData.email,
          phone: formData.phone,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        nomineeDetails: {
          name: formData.nomineeName,
          relation: formData.nomineeRelation,
          phone: formData.nomineePhone,
          email: formData.nomineeEmail,
          address: formData.nomineeAddress,
        },
        donationType: {
          blood: { agreed: bloodDonation, lastDonationDate: formData.lastBloodDonation || null },
          livingOrgans: livingOrgans.filter(o => o),
          posthumousOrgans: posthumousOrgans.filter(o => o),
        },
      };
      await axios.put(`http://localhost:5000/api/donors/${donorId}`, updatedData);
      toast.success("✅ Profile updated successfully!");
      setEditMode(false);
      setProfile({ ...formData, livingOrgans, posthumousOrgans, bloodAgreed: bloodDonation });
    } catch (err) {
      console.error("❌ Error updating donor profile:", err);
      alert("Failed to update profile. Try again.");
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };
  const handleResetPassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return alert("❌ New password and confirm password do not match");
    }
    try {
      await axios.put(`http://localhost:5000/api/donors/${donorId}/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success("✅ Password changed successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      console.error("❌ Password change error:", err);
      alert(err.response?.data?.message || "Failed to change password");
    }
  };
  const validateProfileAndNominee = () => {
    let tempErrors = {};
    // Profile validation
    if (!formData.fullName || formData.fullName.trim() === "") {
      tempErrors.fullName = "Full Name is required.";
    }

    if (!formData.email || formData.email.trim() === "") {
      tempErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Email is not valid.";
    }

    if (!formData.phone || formData.phone.trim() === "") {
      tempErrors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      tempErrors.phone = "Phone number must be exactly 10 digits.";
    }

    if (!formData.addressLine1 || formData.addressLine1.trim() === "") {
      tempErrors.addressLine1 = "Address Line 1 is required.";
    }

    if (!formData.city || formData.city.trim() === "") {
      tempErrors.city = "City is required.";
    }

    if (!formData.state || formData.state.trim() === "") {
      tempErrors.state = "State is required.";
    }

    if (!formData.pincode || formData.pincode.trim() === "") {
      tempErrors.pincode = "Pincode is required.";
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      tempErrors.pincode = "Pincode must be exactly 6 digits.";
    }
    // Nominee validation only if posthumous organs exist
    if (posthumousOrgans.length > 0) {
      if (!formData.nomineeName || formData.nomineeName.trim() === "") {
        tempErrors.nomineeName = "Nominee Full Name is required.";
      }
      if (!formData.nomineeRelation || formData.nomineeRelation.trim() === "") {
        tempErrors.nomineeRelation = "Nominee Relationship is required.";
      }
      if (!formData.nomineePhone || formData.nomineePhone.trim() === "") {
        tempErrors.nomineePhone = "Nominee Contact Number is required.";
      } else if (!/^\d{10}$/.test(formData.nomineePhone)) {
        tempErrors.nomineePhone = "Nominee Phone must be exactly 10 digits.";
      }
      if (formData.nomineeEmail && formData.nomineeEmail.trim() !== "") {
        if (!/^\S+@\S+\.\S+$/.test(formData.nomineeEmail)) {
          tempErrors.nomineeEmail = "Nominee Email is not valid.";
        }
      }
      if (!formData.nomineeAddress || formData.nomineeAddress.trim() === "") {
        tempErrors.nomineeAddress = "Nominee Address is required.";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleBloodDonation = () => {
    const today = new Date();
    const updatedData = {
      donationType: {
        blood: {
          agreed: true,
          lastDonationDate: today.toISOString(),
        },
      },
    };
    axios.put(`http://localhost:5000/api/donors/${donorId}`, updatedData)
      .then(() => {
        setFormData({ ...formData, bloodAgreed: true, lastBloodDonation: today.toISOString() });
        setBloodDonation(true);
        toast.success("✅ Blood donation date saved!");
      })
      .catch(err => {
        console.error("❌ Error saving blood donation:", err);
        alert("Failed to save donation. Try again.");
      });
  };
  const getNextEligibleDate = () => {
    if (!formData.lastBloodDonation) return null;
    const lastDate = new Date(formData.lastBloodDonation);
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + 90);
    return nextDate.toLocaleDateString();
  };
  if (!profile) return <p style={{ padding: 20 }}>Loading donor profile...</p>;
  const menuItems = [
    { name: "Profile", icon: <FaUser /> },
    { name: "Requests", icon: <MdAssignment />, count: requests.length },
    { name: "Nominee", icon: <FaNotesMedical /> },
    { name: "Notifications", icon: <FaBell />, count: notifications.length },
    { name: "Health Tips", icon: <MdHealthAndSafety /> },
    { name: "Organs", icon: <MdHealthAndSafety /> },
    // { name: "Donation History", icon: <MdAssignment />, count: donationHistory.length },
    { name: "Reset Password", icon: <FaUser /> },
    { name: "Logout", icon: <FaSignOutAlt /> },
  ];
  console.log("Current Requests state:", requests);
  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <div className="donor-dashboard__bg-image-cover" style={{ backgroundImage: `url(${bgImage})` }}></div>
      <Navbar />
      <div className="donor-dashboard__wrapper">
        <aside className="donor-dashboard__sidebar">
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`donor-dashboard__sidebar-btn ${activeSection === item.name ? "active" : ""}`}
              onClick={() => {
                if (item.name === "Logout") {
                  const donorId = localStorage.getItem("donorId");

                  if (window.socket && donorId) {
                    window.socket.emit("donor_logout", { donorId });
                    window.socket.disconnect();
                    console.log("🩸 Donor logged out and socket disconnected");
                  }

                  // Clear any locally stored data
                  localStorage.clear();

                  // Optional: if you have any donor notification states
                  // setNotifications([]);
                  // setUnreadCount(0);

                  // Redirect to homepage/login
                  window.location.href = "/";
                } else {
                  setActiveSection(prev => (prev === item.name ? null : item.name));
                }
              }}
            >
              {item.icon}<span>{item.name}</span>
              {item.count > 0 && <span className="donor-dashboard__sidebar-badge">{item.count}</span>}
            </button>
          ))}
        </aside>
        <main className="donor-dashboard__content">
          <div className="donor-dashboard__inner">
            <header className="donor-dashboard__header">
              <h1 className="donor-dashboard__header-title">Welcome, {profile.fullName} 👋</h1>
              <p className="donor-dashboard__donor-id">Donor ID: {profile.donorId}</p>
              <blockquote className="donor-dashboard__header-quote">"The gift of life is the most precious donation one can make."</blockquote>
            </header>
            <section className="donor-dashboard__content-section">
              {/* PROFILE */}
              {activeSection === "Profile" && (
                <article className="donor-dashboard__card donor-dashboard__card-profile-modal">
                  <h2>My Profile</h2>
                  <div className="donor-dashboard__profile-fields">
                    <label>Full Name</label>
                    <input name="fullName" value={formData.fullName} onChange={handleChange} disabled={!editMode} />
                    {errors.fullName && <p className="error">{errors.fullName}</p>}
                    <label>Blood Type</label>
                    <input name="bloodType" value={formData.bloodType} disabled />
                    <label>Email</label>
                    <input name="email" value={formData.email} onChange={handleChange} disabled={!editMode} />
                    {errors.email && <p className="error">{errors.email}</p>}
                    <label>Phone</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} disabled={!editMode} />
                    {errors.phone && <p className="error">{errors.phone}</p>}
                    <label>Address Line 1</label>
                    <input name="addressLine1" value={formData.addressLine1} onChange={handleChange} disabled={!editMode} />
                    {errors.addressLine1 && <p className="error">{errors.addressLine1}</p>}
                    <label>Address Line 2</label>
                    <input name="addressLine2" value={formData.addressLine2} onChange={handleChange} disabled={!editMode} />
                    <label>City</label>
                    <input name="city" value={formData.city} onChange={handleChange} disabled={!editMode} />
                    {errors.city && <p className="error">{errors.city}</p>}
                    <label>State</label>
                    <input name="state" value={formData.state} onChange={handleChange} disabled={!editMode} />
                    {errors.state && <p className="error">{errors.state}</p>}
                    <label>Pincode</label>
                    <input name="pincode" value={formData.pincode} onChange={handleChange} disabled={!editMode} />
                    {errors.pincode && <p className="error">{errors.pincode}</p>}
                  </div>
                  <div className="donor-dashboard__profile-buttons">
                    {editMode ? (
                      <>
                        <button className="donor-dashboard__btn donor-dashboard__btn--save" onClick={handleSave}>Save</button>
                        <button className="donor-dashboard__btn donor-dashboard__btn--cancel" onClick={() => setEditMode(false)}>Cancel</button>
                      </>
                    ) : (
                      <button className="donor-dashboard__btn donor-dashboard__btn--edit" onClick={() => setEditMode(true)}>Edit Profile</button>
                    )}
                  </div>
                </article>
              )}
              {/* Donation History */}
              {activeSection === "Donation History" && (
                <article className="donor-dashboard__card donor-dashboard__donation-history-section">
                  <h2>Donation History</h2>
                  {donationHistory.length > 0 ? (
                    <div className="donor-dashboard__donation-list">
                      {donationHistory.map((donation, index) => (
                        <div key={index} className={`donor-dashboard__donation-card ${donation.status.toLowerCase()}`}>
                          <p><strong>Type:</strong> {donation.type}</p>
                          <p><strong>Date:</strong> {donation.date}</p>
                          <p><strong>Status:</strong> <span className="donor-dashboard__status">{donation.status}</span></p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No past donations available.</p>
                  )}
                </article>
              )}
              {/* Nominee */}
              {activeSection === "Nominee" && (
                <article className="donor-dashboard__card donor-dashboard__card-profile-modal">
                  <h2>Nominee Details</h2>

                  {/* Reminder for posthumous organ */}
                  {showNomineeReminder && (
                    <p style={{ color: "red", fontWeight: "600", marginBottom: "10px" }}>
                      ⚠️ You have added a posthumous organ. Please fill nominee details!
                    </p>
                  )}
                  <div className="donor-dashboard__profile-fields">
                    <label>Full Name</label>
                    <input
                      name="nomineeName"
                      value={formData.nomineeName}
                      onChange={handleChange}
                      disabled={!editMode || (livingOrgans.length > 0 && posthumousOrgans.length === 0)}
                    />
                    {errors.nomineeName && <p className="error">{errors.nomineeName}</p>}
                    <label>Relationship</label>
                    <input
                      name="nomineeRelation"
                      value={formData.nomineeRelation}
                      onChange={handleChange}
                      disabled={!editMode || (livingOrgans.length > 0 && posthumousOrgans.length === 0)}
                    />
                    {errors.nomineeRelation && <p className="error">{errors.nomineeRelation}</p>}
                    <label>Phone</label>
                    <input
                      name="nomineePhone"
                      value={formData.nomineePhone}
                      onChange={handleChange}
                      disabled={!editMode || (livingOrgans.length > 0 && posthumousOrgans.length === 0)}
                    />
                    {errors.nomineePhone && <p className="error">{errors.nomineePhone}</p>}
                    <label>Email</label>
                    <input
                      name="nomineeEmail"
                      value={formData.nomineeEmail}
                      onChange={handleChange}
                      disabled={!editMode || (livingOrgans.length > 0 && posthumousOrgans.length === 0)}
                    />
                    {errors.nomineeEmail && <p className="error">{errors.nomineeEmail}</p>}
                    <label>Address</label>
                    <input
                      name="nomineeAddress"
                      value={formData.nomineeAddress}
                      onChange={handleChange}
                      disabled={!editMode || (livingOrgans.length > 0 && posthumousOrgans.length === 0)}
                    />
                    {errors.nomineeAddress && <p className="error">{errors.nomineeAddress}</p>}
                  </div>
                  <div className="donor-dashboard__profile-buttons">
                    {editMode ? (
                      <>
                        <button className="donor-dashboard__btn donor-dashboard__btn--save" onClick={handleSave}>Save</button>
                        <button className="donor-dashboard__btn donor-dashboard__btn--cancel" onClick={() => setEditMode(false)}>Cancel</button>
                      </>
                    ) : (
                      <button className="donor-dashboard__btn donor-dashboard__btn--edit" onClick={() => setEditMode(true)}>Edit Nominee</button>
                    )}
                  </div>
                </article>
              )}
              {/* Organs & Blood Donation */}
              {activeSection === "Organs" && (
                <article className="donor-dashboard__card donor-dashboard__card-profile-modal">
                  <h2>Organ Donation Details</h2>
                  {/* Living Organs */}
                  <div className="donor-dashboard__organ-section">
                    <h3>Living Organs</h3>
                    <div className="donor-dashboard__organ-list">
                      {livingOrgans.map((organ, index) => (
                        <div className="donor-dashboard__organ-row" key={index}>
                          <input
                            className="donor-dashboard__organ-input"
                            value={organ}
                            disabled={!editMode}
                            onChange={(e) => handleLivingOrgansChange(index, e.target.value)}
                          />
                          {editMode && (
                            <button className="donor-dashboard__organ-remove-btn" onClick={() => removeLivingOrgan(index)}>❌</button>
                          )}
                        </div>
                      ))}
                    </div>
                    {editMode && (
                      <button className="donor-dashboard__organ-add-btn" onClick={addLivingOrgan}>+ Add Living Organ</button>
                    )}
                  </div>
                  {/* Posthumous Organs */}
                  <div className="donor-dashboard__organ-section">
                    <h3>Posthumous Organs</h3>
                    <div className="donor-dashboard__organ-list">
                      {posthumousOrgans.map((organ, index) => (
                        <div className="donor-dashboard__organ-row" key={index}>
                          <input
                            className="donor-dashboard__organ-input"
                            value={organ}
                            disabled={!editMode}
                            onChange={(e) => handlePosthumousOrgansChange(index, e.target.value)}
                          />
                          {editMode && (
                            <button className="donor-dashboard__organ-remove-btn" onClick={() => removePosthumousOrgan(index)}>❌</button>
                          )}
                        </div>
                      ))}
                    </div>
                    {editMode && (
                      <button className="donor-dashboard__organ-add-btn" onClick={addPosthumousOrgan}>+ Add Posthumous Organ</button>
                    )}
                  </div>
                  {/* Blood Donation */}
                  <div style={{ marginTop: 20 }}>
                    <h3>Blood Donation</h3>
                    <label>
                      <input
                        type="checkbox"
                        checked={bloodDonation}
                        onChange={(e) => setBloodDonation(e.target.checked)}
                        disabled={!editMode}
                      />
                      I am willing to donate blood
                    </label>
                    {bloodDonation && (
                      <div style={{ marginTop: 10 }}>
                        <button className="donor-dashboard__btn donor-dashboard__btn--save" onClick={handleBloodDonation}>I donated blood today</button>
                        {formData.lastBloodDonation && (
                          <p>
                            You donated on {new Date(formData.lastBloodDonation).toLocaleDateString()}.<br />
                            Next eligible donation: {getNextEligibleDate()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="donor-dashboard__profile-buttons" style={{ marginTop: 10 }}>
                    {editMode ? (
                      <>
                        <button className="donor-dashboard__btn donor-dashboard__btn--save" onClick={handleSave}>Save</button>
                        <button className="donor-dashboard__btn donor-dashboard__btn--cancel" onClick={() => setEditMode(false)}>Cancel</button>
                      </>
                    ) : (
                      <button className="donor-dashboard__btn donor-dashboard__btn--edit" onClick={() => setEditMode(true)}>Edit Organs</button>
                    )}
                  </div>
                </article>
              )}
              {/* Requests */}
              {activeSection === "Requests" && (
                <article className="donor-dashboard__card donor-dashboard__requests-section">
                  <h2>Incoming Organ Requests</h2>
                  {requests.length > 0 ? (
                    <div className="donor-dashboard__requests-list">
                      {requests.map((req) => (
                        <div
                          key={req.requestId}
                          className={`donor-dashboard__request-card ${req.status?.toLowerCase() || "pending"}`}
                        >
                          <h3>Hospital: {req.hospitalName || "Unknown"}</h3>
                          <p><strong>City:</strong> {req.hospitalCity || "N/A"}</p>
                          <p><strong>Urgency:</strong> {req.urgency || "Not specified"}</p>
                          <p><strong>Status:</strong> <span className="donor-dashboard__status">{req.status}</span></p>
                          <p><strong>Organ Needed:</strong> {req.organNeeded}</p>
                          <p><strong>Date:</strong> {req.date}</p>
                          <div className="donor-dashboard__request-actions">
                            <button
                              type="button"  // Add explicit type to prevent default submit
                              className="donor-dashboard__btn donor-dashboard__btn--accept"
                              onClick={(e) => { e.preventDefault(); handleAccept(req.requestId); }}
                            >
                              Accept
                            </button>
                            <button
                              type="button"  // Add explicit type to prevent default submit
                              className="donor-dashboard__btn donor-dashboard__btn--decline"
                              onClick={(e) => { e.preventDefault(); handleReject(req.requestId); }}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No requests available at the moment.</p>
                  )}
                </article>
              )}
              {/* Notifications */}
              {activeSection === "Notifications" && (
                <article className="donor-dashboard__card donor-dashboard__notifications-section">
                  <h2>Notifications / Alerts</h2>
                  {notifications.length > 0 ? (
                    notifications.map((n, i) => (
                      <div key={i} className="donor-dashboard__notification">
                        {typeof n === "string" ? n : "You have a new organ request. Go to Incoming Requests tab to view."}
                      </div>
                    ))
                  ) : (
                    <p>No new notifications</p>
                  )}
                </article>
              )}
              {/* Health Tips */}
              {activeSection === "Health Tips" && (
                <article className="donor-dashboard__card donor-dashboard__healthtips-section">
                  <h2>Health Tips</h2>
                  {dummyAiTips
                    .trim()
                    .split("\n")
                    .map(s => s.trim())
                    .filter(Boolean)
                    .map((tip, i) => (
                      <p key={i}>{tip}</p>
                    ))}
                </article>
              )}
              {/* Reset Password */}
              {activeSection === "Reset Password" && (
                <article className="donor-dashboard__card donor-dashboard__resetpassword-section">
                  <h2>Reset Password</h2>
                  <label>Current Password</label>
                  <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} />
                  <label>New Password</label>
                  <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} />
                  <label>Confirm New Password</label>
                  <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} />
                  <button className="donor-dashboard__btn donor-dashboard__btn--save" onClick={handleResetPassword} style={{ marginTop: "1rem" }}>Change Password</button>
                </article>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default DonorDashboard;
