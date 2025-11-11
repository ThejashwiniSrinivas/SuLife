// src/components/Unauthorized.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Unauthorized.css"; // Import CSS file

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="unauth-container">
      {/* Navbar */}
      <Navbar />

      {/* Content */}
      <div className="unauth-content">
        <div className="unauth-card">
          <div className="unauth-icon">❌</div>
          <h1>Unauthorized Access</h1>
          <p>
            You don’t have permission to view this page. <br />
            Please login with the correct role.
          </p>
          <div className="unauth-buttons">
            <button onClick={() => navigate(-1)} className="btn back">
              Go Back
            </button>
            <button onClick={() => navigate("/login")} className="btn login">
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
