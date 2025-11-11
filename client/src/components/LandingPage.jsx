import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import bg from "../assets/landingbg.jpg";
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);

  return (
    <div
      className="landing-container"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Navbar */}
      <header className="navbar">
        <div className="logo">
          <img src={logo} alt="SuLife Logo" />
          <span>SuLife</span>
        </div>
        <nav>
          <button onClick={() => navigate("/about")}>About Us</button>
          <button onClick={() => setShowContact(true)}>Contact</button>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="hero-content">
        <h1 className="main-title">SuLife</h1>
        <p className="tagline">
          An <span>AI-enabled</span> Organ & Blood Donation <br />
          Management System
        </p>
        {/* ✅ Added navigation to /register */}
        <button
          className="get-started"
          onClick={() => navigate("/register")}
        >
          Get Started
        </button>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="modal-overlay" onClick={() => setShowAbout(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>About SuLife</h2>
            <p>
              SuLife is a next-generation platform connecting donors, hospitals,
              doctors, and patients. It ensures ethical, secure, and transparent
              organ and blood donation powered by AI to save lives.
            </p>
            <button onClick={() => setShowAbout(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContact && (
        <div className="modal-overlay" onClick={() => setShowContact(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Contact Us</h2>
            <p>Email: support@sulife.org</p>
            <p>Phone: +91-9876543210</p>
            <button onClick={() => setShowContact(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
