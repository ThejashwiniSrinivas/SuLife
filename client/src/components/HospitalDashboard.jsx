import React, { useState, useEffect, useRef } from 'react';
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import "./HospitalDashboard.css";
import Navbar from "./Navbar";
import { toast } from 'react-toastify';
import {
  FaHome,
  FaHospital,
  FaUserMd,
  FaUsers,
  FaNotesMedical,
  FaBell,
  FaSignOutAlt,
  FaEdit,
  FaSave,
} from "react-icons/fa";
import bgImage from "../assets/doctor.jpg";
import axios from "axios";
const HospitalDashboard = () => {
  // --- Main States ---
  const [activeSection, setActiveSection] = useState("dashboard");
  const [hospitalName, setHospitalName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [showSubmittedRequests, setShowSubmittedRequests] = useState(false);
  const [showDoctors, setShowDoctors] = useState(false);
  const [showPatients, setShowPatients] = useState(false);
  const notifiedDonorIdsRef = useRef(new Set());

  // Initialize notified IDs from localStorage so voice doesn't repeat on refresh
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("notifiedDonorIds") || "[]");
      notifiedDonorIdsRef.current = new Set(Array.isArray(stored) ? stored : []);
    } catch (e) {
      console.error("Failed to read notifiedDonorIds from localStorage", e);
      notifiedDonorIdsRef.current = new Set();
    }
  }, []);

  // --- Hospital Data ---
  const [profileData, setProfileData] = useState({
    hospitalName: "",
    registrationNumber: "",
    hospitalEmail: "",
    hospitalPhone: "",
    authorizedName: "",
    authorizedPhone: "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [patientsCount, setPatientsCount] = useState(0);
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);

  // --- Doctors & Patients ---
  const [doctors, setDoctors] = useState([]);
  const [newDoctor, setNewDoctor] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
  });

  const [patients, setPatients] = useState([]);
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "",
    bloodGroup: "",
    email: "",
    phone: "",
  });

  // --- Patient Search & Suggestions ---
  const [patientQuery, setPatientQuery] = useState("");
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [filteredPatients, setFilteredPatients] = useState([]);

  // --- Organ Requests ---
  const [organRequests, setOrganRequests] = useState([]);
  const [matchedDonors, setMatchedDonors] = useState([]);
  const [requestData, setRequestData] = useState({
    patientId: "",
    name: "",
    age: "",
    bloodGroup: "",
    organNeeded: "",
    urgency: "",
    notes: "",
    city: "",
  });
  const [loading, setLoading] = useState(true);

  // --- Notifications & Donor Responses ---
  const [notifications, setNotifications] = useState([]);
  const [donorResponses, setDonorResponses] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  

  const PERSISTED_RESPONSES_KEY = "persistedDonorResponses";

  // Load persisted donor responses on mount so notifications persist across reloads
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(PERSISTED_RESPONSES_KEY) || "null");
      if (Array.isArray(stored) && stored.length > 0) {
        setDonorResponses(stored);
        setUnreadCount(stored.length);
      }
    } catch (e) {
      console.error("Failed to load persisted donor responses", e);
    }
  }, []);

  // Persist donorResponses to localStorage whenever they change so they remain until logout
  useEffect(() => {
    try {
      localStorage.setItem(PERSISTED_RESPONSES_KEY, JSON.stringify(donorResponses || []));
    } catch (e) {
      console.error("Failed to persist donorResponses", e);
    }
  }, [donorResponses]);

  // Keep unread count in sync with stored donor responses (persists until logout)
  useEffect(() => {
    setUnreadCount(donorResponses ? donorResponses.length : 0);
  }, [donorResponses]);

  const API_BASE = "http://localhost:5000/api/hospital";

  // --- Socket Setup ---
  useEffect(() => {
    const hospitalObjectId = localStorage.getItem("hospitalObjectId");
    if (!hospitalObjectId) return;

    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("🟢 Hospital connected via socket:", newSocket.id);
      newSocket.emit("hospital_join", { hospitalId: hospitalObjectId });
      setConnected(true);
    });

    newSocket.on("join_ack", (data) => {
      console.log("Hospital joined room confirmed:", data.hospitalId);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Hospital socket disconnected:", reason);
      setConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Hospital socket connect error:", error);
    });

    // Heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      newSocket.emit("heartbeat");
    }, 10000);

    newSocket.on("heartbeat_ack", () => {
      console.log("Heartbeat acknowledged");
    });

    // Listen for donor responses
    newSocket.on("donorResponse", (data) => {
      console.log("📩 Donor response received:", data);
      const uniqueId = `${data.donorId}_${data.requestId}`;
      if (notifiedDonorIdsRef.current.has(uniqueId)) {
        // Already notified, skip
        return;
      }
      notifiedDonorIdsRef.current.add(uniqueId);
      // Persist to localStorage so voice won't repeat on refresh
      try {
        const arr = Array.from(notifiedDonorIdsRef.current);
        localStorage.setItem("notifiedDonorIds", JSON.stringify(arr));
      } catch (e) {
        console.error("Failed to persist notifiedDonorIds", e);
      }

      let toastMsg = "";
      let speechMsg = "";

      switch (data.status) {
        case "accepted":
          toastMsg = `Donor ${data.donorName || data.donorId} accepted the request for ${data.organNeeded}.`;
          speechMsg = toastMsg;
          toast.success(toastMsg);
          break;
        case "rejected":
          toastMsg = `Donor ${data.donorName || data.donorId} rejected the request for ${data.organNeeded}.`;
          speechMsg = toastMsg;
          toast.info(toastMsg);
          break;
        case "timeout":
          toastMsg = `Donor ${data.donorName || data.donorId} did not respond in time for ${data.organNeeded}.`;
          speechMsg = toastMsg;
          toast.info(toastMsg);
          break;
        default:
          toastMsg = `Donor ${data.donorName || data.donorId} responded with status: ${data.status}`;
          speechMsg = toastMsg;
          toast.info(toastMsg);
      }

      try {
        const msg = new SpeechSynthesisUtterance(speechMsg);
        window.speechSynthesis.speak(msg);
      } catch (e) {
        console.error("Speech synthesis error:", e);
      }

  setDonorResponses((prev) => [{ ...data, createdAt: new Date() }, ...prev]);
    });

    return () => {
      clearInterval(heartbeatInterval);
      newSocket.off("donorResponse");
      newSocket.disconnect();
      console.log("Hospital socket disconnected and cleaned up");
    };
  }, []);

  // --- Fetch Hospital Profile ---
  useEffect(() => {
    const hospitalId = localStorage.getItem("hospitalId");
    if (!hospitalId) return;

    axios
      .get(`${API_BASE}/${hospitalId}`)
      .then((res) => {
        const data = res.data;
        setProfileData({
          hospitalName: data.hospitalName || "",
          registrationNumber: data.registrationNumber || "",
          hospitalEmail: data.hospitalEmail || "",
          hospitalPhone: data.hospitalPhone || "",
          authorizedName: data.authorizedName || "",
          authorizedPhone: data.authorizedPhone || "",
        });
        if (data.hospitalName) {
          setHospitalName(data.hospitalName);
          localStorage.setItem("hospitalName", data.hospitalName);
        }
        if (data._id) localStorage.setItem("hospitalObjectId", data._id);
      })
      .catch((err) => console.error("❌ Error fetching hospital profile:", err));

    // Fetch counts
    axios
      .get(`${API_BASE}/${hospitalId}/requests/count`)
      .then((res) => setRequestsCount(res.data.count || 0))
      .catch(() => setRequestsCount(0));

    axios
      .get(`http://localhost:5000/api/patients/hospital/${hospitalId}/count`)
      .then((res) => setPatientsCount(res.data.count || 0))
      .catch(() => setPatientsCount(0));

    axios
      .get(`http://localhost:5000/api/doctors/hospital/${hospitalId}`)
      .then((res) => {
        const doctorsList = res.data.doctors || [];
        setDoctors(doctorsList);
        setDoctorsCount(doctorsList.length);
      })
      .catch(() => {
        setDoctors([]);
        setDoctorsCount(0);
      });

    axios
      .get(`${API_BASE}/${hospitalId}/notifications`)
      .then((res) => setNotifications(res.data.notifications || []))
      .catch(() => setNotifications([]));
  }, []);

  // --- Fetch Organ Requests ---
  const fetchOrganRequests = async () => {
    try {
      const hospitalId = localStorage.getItem("hospitalObjectId");
      if (!hospitalId) return;
      const res = await axios.get(`http://localhost:5000/api/organ-requests/hospital/${hospitalId}`);
      setOrganRequests(res.data.requests || []);
    } catch (err) {
      console.error("Error fetching organ requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganRequests();
  }, []);

  // --- Fetch Donor Responses from backend ---
  // Helper: persist notified IDs set to localStorage
  const persistNotifiedIds = (set) => {
    try {
      const arr = Array.from(set);
      localStorage.setItem("notifiedDonorIds", JSON.stringify(arr));
    } catch (e) {
      console.error("Failed to persist notifiedDonorIds", e);
    }
  };

  // Fetch pending donor responses from backend and play voice only for new ones
  const fetchPendingDonorResponses = async (hospitalObjectId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/hospital/${hospitalObjectId}/notifications`);
      const donorResponsesFromServer = res.data.donorResponses || [];
      const persistedKey = "persistedDonorResponses";

      // If server returned responses, persist them locally so they're visible on subsequent reloads
      if (donorResponsesFromServer.length > 0) {
        try {
          localStorage.setItem(persistedKey, JSON.stringify(donorResponsesFromServer));
        } catch (e) {
          console.error("Failed to persist donorResponses to localStorage", e);
        }
      }

      // Determine which responses are new (not yet notified locally)
      const newResponses = [];
      donorResponsesFromServer.forEach((n) => {
        const uniqueId = `${n.donorId}_${n.requestId}`;
        if (!notifiedDonorIdsRef.current.has(uniqueId)) {
          newResponses.push(n);
          notifiedDonorIdsRef.current.add(uniqueId);
        }
      });

      // Persist the notified ids so voice won't replay after refresh
      persistNotifiedIds(notifiedDonorIdsRef.current);

      // Prepend server responses (preserve server order) but avoid duplicates.
      // If server returned none, fall back to locally persisted responses so the UI still shows them.
      let sourceResponses = donorResponsesFromServer;
      if (sourceResponses.length === 0) {
        try {
          const stored = JSON.parse(localStorage.getItem(persistedKey) || "null");
          if (Array.isArray(stored) && stored.length > 0) sourceResponses = stored;
        } catch (e) {
          console.error("Failed to read persisted donor responses", e);
        }
      }

      setDonorResponses((prev) => {
        const existingIds = new Set(prev.map(p => `${p.donorId}_${p.requestId}`));
        const merged = [...sourceResponses.filter(p => !existingIds.has(`${p.donorId}_${p.requestId}`)), ...prev];
        return merged;
      });

      // Play voice + toast for the new responses only, and update unread count
      if (newResponses.length > 0) {
        newResponses.forEach((data) => {
          let toastMsg = "";
          let speechMsg = "";
          switch (data.status) {
            case "accepted":
              toastMsg = `Donor ${data.donorName || data.donorId} accepted the request for ${data.organNeeded}.`;
              speechMsg = toastMsg;
              toast.success(toastMsg);
              break;
            case "rejected":
              toastMsg = `Donor ${data.donorName || data.donorId} rejected the request for ${data.organNeeded}.`;
              speechMsg = toastMsg;
              toast.info(toastMsg);
              break;
            case "timeout":
              toastMsg = `Donor ${data.donorName || data.donorId} did not respond in time for ${data.organNeeded}.`;
              speechMsg = toastMsg;
              toast.info(toastMsg);
              break;
            default:
              toastMsg = `Donor ${data.donorName || data.donorId} responded with status: ${data.status}`;
              speechMsg = toastMsg;
              toast.info(toastMsg);
          }

          try {
            const msg = new SpeechSynthesisUtterance(speechMsg);
            window.speechSynthesis.speak(msg);
          } catch (e) {
            console.error("Speech synthesis error:", e);
          }
        });

  // unreadCount is synced from donorResponses (persisted), no direct increment here
      }
    } catch (err) {
      console.error("Failed to fetch donor responses", err);
    }
  };

  // Call fetchPendingDonorResponses on mount if hospitalObjectId already exists
  useEffect(() => {
    const hospitalObjectId = localStorage.getItem("hospitalObjectId");
    if (hospitalObjectId) fetchPendingDonorResponses(hospitalObjectId);
  }, []);

  // Also call fetchPendingDonorResponses when profileData changes and hospitalObjectId becomes available
  useEffect(() => {
    const hospitalObjectId = localStorage.getItem("hospitalObjectId");
    if (hospitalObjectId) fetchPendingDonorResponses(hospitalObjectId);
  }, [profileData.hospitalName]);

  // --- Handle Active Section Changes ---
  useEffect(() => {
    const hospitalId = localStorage.getItem("hospitalId");
    if (!hospitalId) return;

    if (activeSection === "doctors") {
      axios
        .get(`http://localhost:5000/api/doctors/hospital/${hospitalId}`)
        .then((res) => {
          const doctorsList = res.data.doctors || [];
          setDoctors(doctorsList);
          setDoctorsCount(doctorsList.length);
        })
        .catch((err) => console.error("❌ Error fetching doctors:", err));
    }

    if (activeSection === "patients") {
      axios
        .get(`http://localhost:5000/api/patients/hospital/${hospitalId}`)
        .then((res) => {
          const patientsList = res.data.patients || [];
          setPatients(patientsList);
          setFilteredPatients(patientsList);
          setPatientsCount(patientsList.length);
        })
        .catch((err) => {
          setPatients([]);
          setPatientsCount(0);
          console.error("❌ Error fetching patients:", err);
        });
    }
  }, [activeSection]);

  // --- Filter patients for search ---
  useEffect(() => {
    if (!patientSearchQuery) {
      setFilteredPatients(patients);
    } else {
      setFilteredPatients(
        patients.filter((pat) =>
          pat.name.toLowerCase().includes(patientSearchQuery.toLowerCase())
        )
      );
    }
  }, [patients, patientSearchQuery]);

  // --- Patient Autocomplete ---
  const handlePatientQueryChange = async (e) => {
    const value = e.target.value;
    setPatientQuery(value);
    setRequestData((prev) => ({
      ...prev,
      patientId: "",
      name: "",
      age: "",
      bloodGroup: "",
      city: "",
    }));

    if (!value.trim()) {
      setPatientSuggestions([]);
      return;
    }

    try {
      const hospitalId = localStorage.getItem("hospitalId");
      const res = await axios.get(
        `http://localhost:5000/api/patients/search?q=${value}&hospitalId=${hospitalId}`
      );
      const suggestions = res.data.patients || [];
      setPatientSuggestions(suggestions);

      const exactMatch = suggestions.find((pat) => pat.name.toLowerCase() === value.toLowerCase());
      if (exactMatch) {
        setRequestData((prev) => ({
          ...prev,
          patientId: exactMatch.id,
          name: exactMatch.name,
          age: exactMatch.age,
          bloodGroup: exactMatch.bloodGroup,
          city: exactMatch.city || "",
          organNeeded: prev.organNeeded,
          urgency: prev.urgency,
          notes: prev.notes,
        }));
        setPatientSuggestions([]);
      }
    } catch (err) {
      console.error("❌ Error fetching patient suggestions:", err);
    }
  };

  const handlePatientSuggestionClick = (pat) => {
    setRequestData((prev) => ({
      ...prev,
      patientId: pat.id,
      name: pat.name,
      age: pat.age,
      bloodGroup: pat.bloodGroup,
      city: pat.city || "",
      organNeeded: prev.organNeeded,
      urgency: prev.urgency,
      notes: prev.notes,
    }));
    setPatientQuery(pat.name);
    setPatientSuggestions([]);
    setMatchedDonors([]);
  };

  // --- Form Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDoctorInputChange = (e) => {
    const { name, value } = e.target;
    setNewDoctor((prev) => ({ ...prev, [name]: value }));
  };

  const handlePatientInputChange = (e) => {
    const { name, value } = e.target;
    setNewPatient((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestChange = (e) => {
    const { name, value } = e.target;
    setRequestData((prev) => ({ ...prev, [name]: value }));
  };

  // --- Profile Validation & Save ---
  const validateProfile = () => {
    const tempErrors = {};
    if (!profileData.hospitalName?.trim()) tempErrors.hospitalName = "Hospital name is required.";
    if (!profileData.registrationNumber?.trim()) tempErrors.registrationNumber = "Registration number is required.";
    if (!profileData.hospitalEmail?.trim()) tempErrors.hospitalEmail = "Hospital email is required.";
    else if (!/\S+@\S+\.\S+/.test(profileData.hospitalEmail)) tempErrors.hospitalEmail = "Email is not valid.";
    if (!profileData.hospitalPhone?.trim()) tempErrors.hospitalPhone = "Hospital phone is required.";
    else if (!/^\d{10}$/.test(profileData.hospitalPhone)) tempErrors.hospitalPhone = "Phone number must be 10 digits.";
    if (!profileData.authorizedName?.trim()) tempErrors.authorizedName = "Authorized person name is required.";
    if (!profileData.authorizedPhone?.trim()) tempErrors.authorizedPhone = "Authorized phone is required.";
    else if (!/^\d{10}$/.test(profileData.authorizedPhone)) tempErrors.authorizedPhone = "Authorized phone must be 10 digits.";

    setProfileErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!validateProfile()) {
      alert("Please fix profile validation errors before saving.");
      return;
    }
    const hospitalId = localStorage.getItem("hospitalId");
    try {
      const res = await axios.put(`${API_BASE}/${hospitalId}`, profileData);
      const updated = res.data.hospital;
      setProfileData({
        hospitalName: updated.hospitalName || "",
        registrationNumber: updated.registrationNumber || "",
        hospitalEmail: updated.hospitalEmail || "",
        hospitalPhone: updated.hospitalPhone || "",
        authorizedName: updated.authorizedName || "",
        authorizedPhone: updated.authorizedPhone || "",
      });
      if (updated.hospitalName) {
        setHospitalName(updated.hospitalName);
        localStorage.setItem("hospitalName", updated.hospitalName);
      }
      setIsEditing(false);
      alert("✅ Profile updated successfully!");
    } catch (err) {
      console.error("❌ Error updating profile:", err);
      alert("Failed to update profile.");
    }
  };

  // --- Add/Remove Doctor ---
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    const hospitalId = localStorage.getItem("hospitalId");
    try {
      const res = await axios.post(`http://localhost:5000/api/doctors`, {
        ...newDoctor,
        hospital: hospitalId,
      });
      setDoctors((prev) => [res.data.doctor, ...prev]);
      setDoctorsCount((prev) => prev + 1);
      setNewDoctor({ name: "", email: "", phone: "", specialization: "" });
      alert("✅ Doctor added successfully!");
    } catch (err) {
      console.error("❌ Error adding doctor:", err.response?.data || err.message);
      alert("Failed to add doctor.");
    }
  };

  const handleRemoveDoctor = async (id) => {
    if (!window.confirm("Are you sure you want to remove this doctor?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/doctors/${id}`);
      setDoctors((prev) => prev.filter((doc) => doc._id !== id));
      setDoctorsCount((prev) => Math.max(prev - 1, 0));
      alert("✅ Doctor removed successfully!");
    } catch (err) {
      console.error("❌ Error removing doctor:", err.response?.data || err.message);
      alert("Failed to remove doctor.");
    }
  };

  // --- Add/Remove Patient ---
  const handleAddPatient = async (e) => {
    e.preventDefault();
    const hospitalId = localStorage.getItem("hospitalId");

    if (!newPatient.name.trim()) { alert("❌ Patient name is required."); return; }
    if (!newPatient.age || isNaN(newPatient.age) || newPatient.age <= 0) { alert("❌ Enter a valid age."); return; }
    if (!newPatient.gender) { alert("❌ Select gender."); return; }
    if (!newPatient.bloodGroup) { alert("❌ Select blood group."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPatient.email)) { alert("❌ Enter a valid email address."); return; }
    if (!/^\d{10}$/.test(newPatient.phone)) { alert("❌ Enter a valid 10-digit phone number."); return; }

    try {
      const res = await axios.post("http://localhost:5000/api/patients", {
        ...newPatient,
        age: Number(newPatient.age),
        hospital: hospitalId,
      });
      setPatients((prev) => [res.data.patient, ...prev]);
      setPatientsCount((prev) => prev + 1);
      setNewPatient({ name: "", age: "", gender: "", bloodGroup: "", email: "", phone: "" });
      alert("✅ Patient registered successfully!");
    } catch (err) {
      console.error("❌ Error adding patient:", err.response?.data || err.message);
      alert("Failed to register patient.");
    }
  };

  const handleRemovePatient = async (id) => {
    if (!window.confirm("Are you sure you want to remove this patient?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/patients/${id}`);
      setPatients((prev) => prev.filter((pat) => pat._id !== id));
      setPatientsCount((prev) => Math.max(prev - 1, 0));
      alert("✅ Patient removed successfully!");
    } catch (err) {
      console.error("❌ Error removing patient:", err.response?.data || err.message);
      alert("Failed to remove patient.");
    }
  };

  // --- Organ Request Submit ---
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestData.patientId) { alert("❌ Select a patient first."); return; }
    if (!requestData.urgency) { alert("❌ Select urgency level."); return; }

    try {
      const hospitalObjectId = localStorage.getItem("hospitalObjectId");
      const res = await axios.post(`http://localhost:5000/api/organ-requests`, {
        ...requestData,
        hospital: hospitalObjectId,
        status: "pending",
        age: Number(requestData.age),
      });
      await fetchOrganRequests();
      setMatchedDonors(res.data.matches || []);
      setRequestData({
        patientId: "",
        name: "",
        age: "",
        bloodGroup: "",
        organNeeded: "",
        urgency: "",
        notes: "",
        city: "",
      });
      setPatientQuery("");
      alert("✅ Request submitted successfully!");
    } catch (err) {
      console.error("❌ Error submitting request:", err.response?.data || err.message);
      alert("Failed to submit request: " + (err.response?.data?.message || err.message));
    }
  };

  // --- Menu Click & Logout ---
  const menuItems = [
    { name: "dashboard", label: "Dashboard", icon: <FaHome /> },
    { name: "profile", label: "Profile", icon: <FaHospital /> },
    { name: "doctors", label: "Doctors", icon: <FaUserMd /> },
    { name: "patients", label: "Patients", icon: <FaUsers /> },
    { name: "requests", label: "Organ Requests", icon: <FaNotesMedical /> },
    { name: "notifications", label: "Notifications", icon: <FaBell /> },
    { name: "logout", label: "Logout", icon: <FaSignOutAlt /> },
  ];

  const handleMenuClick = (name) => {
    if (name === "logout") {
      const hospitalId = localStorage.getItem("hospitalObjectId");
      if (socket && hospitalId) {
        socket.emit("hospital_logout", { hospitalId });
        socket.disconnect();
      }
      // Clear only the keys related to notifications and hospital session
      try {
        localStorage.removeItem(PERSISTED_RESPONSES_KEY);
        localStorage.removeItem("notifiedDonorIds");
        // clear related hospital identifiers/safe keys
        localStorage.removeItem("hospitalName");
        localStorage.removeItem("hospitalObjectId");
        localStorage.removeItem("hospitalId");
      } catch (e) {
        console.error("Error clearing localStorage on logout", e);
      }
      window.location.href = "/";
    } else setActiveSection(name);
  };

  // Acknowledge and clear all notifications (client-side), optionally notify backend
  const acknowledgeAllNotifications = async () => {
    if (!donorResponses || donorResponses.length === 0) return;
    if (!window.confirm('Acknowledge and clear all notifications?')) return;
    const hospitalObjectId = localStorage.getItem('hospitalObjectId');
    try {
      if (hospitalObjectId) {
        await axios.post(`${API_BASE}/${hospitalObjectId}/notifications/acknowledge`, {
          notifications: donorResponses,
        });
      }
    } catch (e) {
      console.warn('Failed to notify backend about acknowledgement', e);
    }

    // Clear persisted and in-memory notifications
    try {
      localStorage.removeItem(PERSISTED_RESPONSES_KEY);
      localStorage.removeItem('notifiedDonorIds');
    } catch (e) {
      console.error('Error clearing persisted notifications', e);
    }
    setDonorResponses([]);
    setUnreadCount(0);
    toast.success('Notifications acknowledged');
  };

  return (
    <div className="hospital-dashboard-container">
      <div
        className="hospital-dashboard-bg"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="hospital-dashboard-overlay" />
      <Navbar />
      <div className="hospital-dashboard-main">
        {/* Sidebar */}
        <aside className="hospital-sidebar glass">
          <div className="hospital-name">{hospitalName || "Hospital"}</div>
          <ul>
            {menuItems.map((item) => (
              <li
                key={item.name}
                className={activeSection === item.name ? "active" : ""}
                onClick={() => handleMenuClick(item.name)}
              >
                {item.icon} {item.label}
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <section className="hospital-main-content glass">
          {/* ================== DASHBOARD ================== */}
          {activeSection === "dashboard" && (
            <>
              <h1 className="hospital-welcome-text">
                Welcome, {hospitalName || "Hospital"} 👋
              </h1>
              <div className="dashboard-cards-container">
                <div className="dashboard-cards-row">
                  <div className="stat-card modern-card">
                    <div className="stat-icon patients">
                      <FaUsers />
                    </div>
                    <div className="stat-info">
                      <div className="stat-number">{patientsCount}</div>
                      <div className="stat-label">Active Patients</div>
                    </div>
                  </div>
                  <div className="stat-card modern-card">
                    <div className="stat-icon doctors">
                      <FaUserMd />
                    </div>
                    <div className="stat-info">
                      <div className="stat-number">{doctorsCount}</div>
                      <div className="stat-label">On-Duty Doctors</div>
                    </div>
                  </div>
                  <div className="stat-card modern-card">
                    <div className="stat-icon requests">
                      <FaNotesMedical />
                    </div>
                    <div className="stat-info">
                      <div className="stat-number">{requestsCount}</div>
                      <div className="stat-label">Organ Requests</div>
                    </div>
                  </div>
                </div>

                <div className="modern-card notifications-modern-card">
                  <h3>Recent Alerts & Notifications</h3>
                  <p>🛎️ You have <strong>{unreadCount}</strong> new donor responses</p>
                </div>
              </div>
            </>
          )}

          {/* ================== PROFILE ================== */}
          {activeSection === "profile" && (
            <>
              <h2>Hospital Profile</h2>
              <form onSubmit={handleProfileSave} className="profile-form">
                <label>Hospital Name</label>
                <input
                  name="hospitalName"
                  value={profileData.hospitalName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                {profileErrors.hospitalName && <p className="error-message">{profileErrors.hospitalName}</p>}
                <label>Registration Number</label>
                <input
                  name="registrationNumber"
                  value={profileData.registrationNumber}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                {profileErrors.registrationNumber && <p className="error-message">{profileErrors.registrationNumber}</p>}
                <label>Hospital Email</label>
                <input
                  name="hospitalEmail"
                  value={profileData.hospitalEmail}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                {profileErrors.hospitalEmail && <p className="error-message">{profileErrors.hospitalEmail}</p>}
                <label>Hospital Phone</label>
                <input
                  name="hospitalPhone"
                  value={profileData.hospitalPhone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                {profileErrors.hospitalPhone && <p className="error-message">{profileErrors.hospitalPhone}</p>}
                <label>Authorized Name</label>
                <input
                  name="authorizedName"
                  value={profileData.authorizedName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                {profileErrors.authorizedName && <p className="error-message">{profileErrors.authorizedName}</p>}
                <label>Authorized Phone</label>
                <input
                  name="authorizedPhone"
                  value={profileData.authorizedPhone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                {profileErrors.authorizedPhone && <p className="error-message">{profileErrors.authorizedPhone}</p>}
                <div className="profile-actions">
                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() => setIsEditing(true)}
                    disabled={isEditing}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button type="submit" className="save-btn" disabled={!isEditing}>
                    <FaSave /> Save
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ================== DOCTORS ================== */}
          {activeSection === "doctors" && (
            <>
              <h2>👨‍⚕️ Doctors</h2>

              {/* Add Doctor Form */}
              <form
                className="add-doctor-form glass"
                onSubmit={(e) => {
                  e.preventDefault();

                  // --- Validations ---
                  if (!newDoctor.name.trim()) {
                    alert("❌ Doctor name is required.");
                    return;
                  }

                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(newDoctor.email)) {
                    alert("❌ Enter a valid email address.");
                    return;
                  }

                  const phoneRegex = /^[0-9]{10}$/;
                  if (!phoneRegex.test(newDoctor.phone)) {
                    alert("❌ Enter a valid 10-digit phone number.");
                    return;
                  }

                  if (!newDoctor.specialization.trim()) {
                    alert("❌ Specialization is required.");
                    return;
                  }

                  // --- Call add doctor handler if all validations pass ---
                  handleAddDoctor(e);
                }}
              >
                <input
                  type="text"
                  name="name"
                  placeholder="Doctor Name"
                  value={newDoctor.name}
                  onChange={handleDoctorInputChange}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={newDoctor.email}
                  onChange={handleDoctorInputChange}
                  required
                />
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone"
                  value={newDoctor.phone}
                  onChange={handleDoctorInputChange}
                  required
                />
                <input
                  type="text"
                  name="specialization"
                  placeholder="Specialization"
                  value={newDoctor.specialization}
                  onChange={handleDoctorInputChange}
                  required
                />
                <button type="submit" className="add-doctor-btn">
                  Add Doctor
                </button>
              </form>

              {/* Toggle Button */}
              <div style={{ margin: "1rem 0" }}>
                <button
                  className="toggle-doctors-btn"
                  onClick={() => setShowDoctors((prev) => !prev)}
                >
                  {showDoctors ? "Hide Doctor List" : "Show Doctor List"}
                </button>
              </div>

              {/* Doctors List */}
              {showDoctors && (
                <div className="doctors-list">
                  {doctors.length === 0 ? (
                    <p>No doctors added yet.</p>
                  ) : (
                    doctors.map((doc) => (
                      <div key={doc._id} className="doctor-card glass">
                        <div>
                          <strong>Name:</strong> {doc.name}
                        </div>
                        <div>
                          <strong>Email:</strong> {doc.email}
                        </div>
                        <div>
                          <strong>Phone:</strong> {doc.phone}
                        </div>
                        <div>
                          <strong>Specialization:</strong> {doc.specialization}
                        </div>
                        <button
                          onClick={() => handleRemoveDoctor(doc._id)}
                          className="remove-doctor-btn"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {/* ================== PATIENTS ================== */}
          {activeSection === "patients" && (
            <>
              <h2>🧑‍🦰 Patients</h2>

              {/* Add Patient Form */}
              <form className="add-patient-form glass" onSubmit={handleAddPatient}>
                <input
                  type="text"
                  name="name"
                  placeholder="Patient Name"
                  value={newPatient.name}
                  onChange={handlePatientInputChange}
                  required
                />
                <input
                  type="number"
                  name="age"
                  placeholder="Age"
                  value={newPatient.age}
                  onChange={handlePatientInputChange}
                  required
                />
                <select
                  name="gender"
                  value={newPatient.gender}
                  onChange={handlePatientInputChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  name="bloodGroup"
                  value={newPatient.bloodGroup}
                  onChange={handlePatientInputChange}
                  required
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={newPatient.email}
                  onChange={handlePatientInputChange}
                  required
                />
                <input
                  type="text"
                  name="phone"
                  placeholder="Phone"
                  value={newPatient.phone}
                  onChange={handlePatientInputChange}
                  required
                />

                <button type="submit" className="add-patient-btn">
                  Add Patient
                </button>
              </form>


              {/* Toggle Button */}
              <div style={{ margin: "1rem 0" }}>
                <button
                  className="toggle-patients-btn"
                  onClick={() => setShowPatients((prev) => !prev)}
                >
                  {showPatients ? "Hide Patient List" : "Show Patient List"}
                </button>
              </div>

              {/* Patient Search Input */}
              {showPatients && (
                <div className="patient-search-bar">
                  <input
                    type="text"
                    placeholder="Search patient by name..."
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                  />
                </div>
              )}

              {/* Patients List */}
              {showPatients && (
                <div className="patients-list">
                  {filteredPatients.length === 0 ? (
                    <p>No patients registered yet.</p>
                  ) : (
                    filteredPatients.map((pat) => (
                      <div key={pat._id} className="patient-card glass">
                        <div>
                          <strong>Name:</strong> {pat.name}
                        </div>
                        <div>
                          <strong>Age:</strong> {pat.age}
                        </div>
                        <div>
                          <strong>Gender:</strong> {pat.gender}
                        </div>
                        <div>
                          <strong>Blood Group:</strong> {pat.bloodGroup}
                        </div>
                        <div>
                          <strong>Email:</strong> {pat.email}
                        </div>
                        <div>
                          <strong>Phone:</strong> {pat.phone}
                        </div>

                        {/* Remove Patient */}
                        <button
                          onClick={async () => {
                            if (!window.confirm("Are you sure you want to remove this patient?")) return;
                            try {
                              await axios.delete(`http://localhost:5000/api/patients/${pat._id}`);
                              setPatients((prev) => {
                                const updated = prev.filter((p) => p._id !== pat._id);
                                setPatientsCount(updated.length); // update count dynamically
                                return updated;
                              });
                              alert("✅ Patient removed successfully!");
                            } catch (err) {
                              console.error("❌ Error removing patient:", err.response?.data || err.message);
                              alert("Failed to remove patient.");
                            }
                          }}
                          className="remove-patient-btn"
                        >
                          Remove
                        </button>

                        <Link to={`/patients/${pat._id}/condition`}>
                          <button className="condition-btn">Fill Condition</button>
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {/* ================== ORGAN REQUEST ================== */}
          {activeSection === "requests" && (
            <>
              <h2>📝 Organ / Blood Request</h2>

              {/* --- Organ Request Form --- */}
              <form className="organ-request-form glass" onSubmit={handleRequestSubmit}>
                {/* Patient Autocomplete Input */}
                <input
                  type="text"
                  placeholder="Type patient name"
                  value={patientQuery}
                  onChange={handlePatientQueryChange}
                  autoComplete="off"
                />

                {/* Suggestion List */}
                {patientSuggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {patientSuggestions.map((pat) => (
                      <li
                        key={pat.id} // use `id` from API
                        onClick={() => handlePatientSuggestionClick(pat)}
                      >
                        {pat.name} - {pat.age} yrs - {pat.bloodGroup}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Auto-filled Patient Details */}
                <input type="text" name="name" placeholder="Patient Name" value={requestData.name} readOnly />
                <input type="number" name="age" placeholder="Age" value={requestData.age} readOnly />
                <input type="text" name="bloodGroup" placeholder="Blood Group" value={requestData.bloodGroup} readOnly />

                {/* Editable Organ & Urgency Fields */}
                <input
                  type="text"
                  name="organNeeded"
                  placeholder="Organ Needed (optional for blood only)"
                  value={requestData.organNeeded}
                  onChange={handleRequestChange}
                />
                <select name="urgency" value={requestData.urgency} onChange={handleRequestChange} required>
                  <option value="">Select Urgency</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>

                {/* Optional Notes */}
                <textarea
                  name="notes"
                  value={requestData.notes}
                  onChange={handleRequestChange}
                  placeholder="Optional notes"
                />

                <button type="submit" className="submit-request-btn">
                  Submit Request
                </button>
              </form>

              {/* --- Matched Donors Display --- */}
              {matchedDonors.length > 0 && (
                <div className="matched-donors-container glass">
                  <h3>Top 5 Matched Donors</h3>
                  <table className="matched-donors-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Age</th>
                        <th>City</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchedDonors.map((donor) => (
                        <tr key={donor.donorId}>
                          <td>{donor.name || "N/A"}</td>
                          <td>{donor.age || "Unknown"}</td>
                          <td>{donor.city || "Unknown"}</td>
                          <td>{donor.score ? donor.score.toFixed(2) : "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* --- Toggle Submitted Organ Requests --- */}
              <div style={{ margin: "1rem 0" }}>
                <button
                  className="toggle-submitted-requests-btn"
                  onClick={() => setShowSubmittedRequests((prev) => !prev)}
                >
                  {showSubmittedRequests ? "Hide Submitted Requests" : "Show Submitted Requests"}
                </button>
              </div>

              {showSubmittedRequests && (
                <div className="matched-donors-container glass">
                  {organRequests.length === 0 ? (
                    <p>Loading organ requests or none submitted yet...</p>
                  ) : (
                    <table className="matched-donors-table">
                      <thead>
                        <tr>
                          <th>Patient Name</th>
                          <th>Blood Group</th>
                          <th>Organ Needed</th>
                          <th>Urgency</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {organRequests.map((req) => (
                          <tr key={req._id}>
                            <td>{req.patient?.name || "N/A"}</td>
                            <td>{req.patient?.bloodGroup || "N/A"}</td>
                            <td>{req.organNeeded || "N/A"}</td>
                            <td>{req.urgency || "N/A"}</td>
                            <td>
                              <button
                                className="delete-request-btn"
                                onClick={async () => {
                                  if (!window.confirm("Are you sure you want to delete this request?")) return;
                                  try {
                                    await axios.delete(`http://localhost:5000/api/organ-requests/${req._id}`);
                                    setOrganRequests((prev) => prev.filter((r) => r._id !== req._id));
                                    setRequestsCount((prev) => Math.max(prev - 1, 0));
                                    alert("✅ Organ request deleted successfully!");
                                  } catch (err) {
                                    console.error("❌ Error deleting request:", err.response?.data || err.message);
                                    alert("Failed to delete organ request.");
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}

          {activeSection === "notifications" && (
            <>
              <h2>Donor Response Notifications</h2>
              {donorResponses.length === 0 ? (
                <p>No new notifications</p>
              ) : (
                <ul className="donor-response-list">
                  {donorResponses.map((dr) => {
                    let statusText = "";
                    let statusClass = "";
                    switch (dr.status) {
                      case "accepted":
                        statusText = "Accepted";
                        statusClass = "accepted";
                        break;
                      case "rejected":
                        statusText = "Rejected";
                        statusClass = "rejected";
                        break;
                      case "timeout":
                        statusText = "No Response (Timed Out)";
                        statusClass = "timeout";
                        break;
                      default:
                        statusText = dr.status;
                    }

                    return (
                      <li key={`${dr.donorId}_${dr.requestId}`} className={`donor-response-item ${statusClass}`}>
                        <div><strong>Donor:</strong> {dr.donorName} ({dr.donorId})</div>
                        <div><strong>Status:</strong> {statusText}</div>
                        <div><strong>Organ:</strong> {dr.organNeeded} ({dr.urgency} urgency)</div>
                        <div><strong>Location:</strong> {dr.donorCity}</div>
                        <div><strong>Age:</strong> {dr.donorAge}</div>
                        <div><strong>Phone:</strong> {dr.donorPhone}</div>
                        <div><em>{new Date(dr.createdAt).toLocaleString()}</em></div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div style={{ marginTop: '0.75rem' }}>
                <button className="acknowledge-btn" onClick={acknowledgeAllNotifications}>
                  OK
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default HospitalDashboard;
