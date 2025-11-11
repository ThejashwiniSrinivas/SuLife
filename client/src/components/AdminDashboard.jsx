import React, { useState, useEffect } from "react";
import {
  FaTachometerAlt,
  FaUser,
  FaHospital,
  FaBell,
  FaClipboardList,
  FaList,
  FaSearch,
} from "react-icons/fa";
import Navbar from "./Navbar";
import "./AdminDashboard.css";
import axios from "axios";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [donors, setDonors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingIds, setDeletingIds] = useState([]);

  // ✅ Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [donorRes, hospitalRes, requestRes] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/donors"),
          axios.get("http://localhost:5000/api/admin/hospitals"),
          axios.get("http://localhost:5000/api/admin/requests"),
        ]);
        setDonors(donorRes.data || []);
        setHospitals(hospitalRes.data || []);
        setRequests(requestRes.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ Delete donor
  const handleDeleteDonor = async (id) => {
    if (!window.confirm("Are you sure you want to delete this donor?")) return;
    try {
      setDeletingIds((prev) => [...prev, id]);
      const res = await axios.delete(`http://localhost:5000/api/admin/donors/${id}`);
      if (res.status === 200) {
        setDonors((prev) => prev.filter((d) => d.id !== id));
        alert("Donor deleted successfully");
      }
    } catch (err) {
      console.error("Error deleting donor:", err);
      alert("Failed to delete donor");
    } finally {
      setDeletingIds((prev) => prev.filter((delId) => delId !== id));
    }
  };

  // ✅ Delete hospital
  const handleDeleteHospital = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hospital?")) return;
    try {
      setDeletingIds((prev) => [...prev, id]);
      const res = await axios.delete(`http://localhost:5000/api/admin/hospitals/${id}`);
      if (res.status === 200) {
        setHospitals((prev) => prev.filter((h) => h.id !== id));
        alert("Hospital deleted successfully");
      }
    } catch (err) {
      console.error("Error deleting hospital:", err);
      alert("Failed to delete hospital");
    } finally {
      setDeletingIds((prev) => prev.filter((delId) => delId !== id));
    }
  };

  // ✅ Delete organ request
  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    try {
      setDeletingIds((prev) => [...prev, id]);
      const res = await axios.delete(`http://localhost:5000/api/admin/requests/${id}`);
      if (res.status === 200) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        alert("Request deleted successfully");
      }
    } catch (err) {
      console.error("Error deleting request:", err);
      alert("Failed to delete request");
    } finally {
      setDeletingIds((prev) => prev.filter((delId) => delId !== id));
    }
  };

  // ✅ Filters
  const filteredDonors = donors.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHospitals = hospitals.filter((h) =>
    h.hospitalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = requests.filter((r) =>
    r.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.hospitalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.organNeeded?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Real-time stats
  const stats = {
    donors: donors.length,
    hospitals: hospitals.length,
    requests: requests.length,
  };

  // ✅ Render tabs
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="stats-grid">
            <div className="stat-card donors">
              <h3>Total Donors</h3>
              <p>{stats.donors}</p>
            </div>
            <div className="stat-card hospitals">
              <h3>Total Hospitals</h3>
              <p>{stats.hospitals}</p>
            </div>
            <div className="stat-card requests">
              <h3>Active Requests</h3>
              <p>{stats.requests}</p>
            </div>
          </div>
        );

      case "donors":
        return (
          <div className="table-section">
            <h2>Donor List</h2>
            <div className="search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="Search donors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>City</th>
                  <th>Blood Group</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonors.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>{d.city}</td>
                    <td>{d.bloodGroup}</td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteDonor(d.id)}
                        disabled={deletingIds.includes(d.id)}
                      >
                        {deletingIds.includes(d.id) ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "hospitals":
        return (
          <div className="table-section">
            <h2>Hospital List</h2>
            <div className="search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="Search hospitals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <table>
              <thead>
                <tr>
                  <th>Hospital Name</th>
                  <th>City</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHospitals.map((h) => (
                  <tr key={h.id}>
                    <td>{h.hospitalName}</td>
                    <td>{h.city}</td>
                    <td>{h.email}</td>
                    <td>{h.phone}</td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteHospital(h.id)}
                        disabled={deletingIds.includes(h.id)}
                      >
                        {deletingIds.includes(h.id) ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "requests":
        return (
          <div className="table-section">
            <h2>Organ Requests</h2>
            <div className="search-bar">
              <FaSearch />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Hospital</th>
                  <th>Organ</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>City</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.patientName}</td>
                    <td>{r.hospitalName}</td>
                    <td>{r.organNeeded}</td>
                    <td>{r.urgency}</td>
                    <td>{r.status}</td>
                    <td>{r.city}</td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteRequest(r.id)}
                        disabled={deletingIds.includes(r.id)}
                      >
                        {deletingIds.includes(r.id) ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return <p>Coming soon...</p>;
    }
  };

// ✅ Logout function
const handleLogout = () => {
  localStorage.removeItem("adminToken"); // clear stored session if any
  sessionStorage.clear();
  alert("Logged out successfully!");
  window.location.href = "/"; // redirect to landing page
};

  return (
    <div className="admin-dashboard-page">
      <Navbar />
      <div className="admin-dashboard">
        <aside className="sidebar">
          <h2 className="sidebar-title">Admin Panel</h2>
          <ul>
            <li className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
              <FaTachometerAlt /> Overview
            </li>
            <li className={activeTab === "donors" ? "active" : ""} onClick={() => setActiveTab("donors")}>
              <FaUser /> Donors
            </li>
            <li className={activeTab === "hospitals" ? "active" : ""} onClick={() => setActiveTab("hospitals")}>
              <FaHospital /> Hospitals
            </li>
            <li className={activeTab === "requests" ? "active" : ""} onClick={() => setActiveTab("requests")}>
              <FaClipboardList /> Requests
            </li>
          </ul>
           <button className="logout-btn" onClick={handleLogout}>
    <FaBell /> Logout
  </button>
        </aside>
        <main className="dashboard-content">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
