import React from "react";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/bg.jpg";
import Navbar from "./Navbar";  
import "./AboutUs.css";

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div
      className="about-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* ✅ Navbar with glowing logo */}
      <Navbar />

      {/* Overlay */}
      <div className="overlay"></div>

      {/* Content */}
      <div className="about-content">
        <h1 className="title">SuLife</h1>
        <p className="text fade-in">
          <strong>SuLife</strong> is an AI-powered <strong>Organ & Blood Donation Management System</strong> designed to connect donors, patients, doctors, and hospitals on a single ethical and transparent platform.
        </p>

        <h2 className="subtitle">💡 Our Mission</h2>
        <p className="text slide-up">
          To ensure life-saving donations reach those in need faster, safer, and with complete transparency. Leveraging AI, we aim to:
        </p>

        <ul className="list fade-in">
          <li>🔹 Match donors and recipients efficiently</li>
          <li>🔹 Reduce waiting time for organ & blood requests</li>
          <li>🔹 Ensure ethical and secure medical practices</li>
          <li>🔹 Support hospitals with advanced AI tools</li>
        </ul>

        <h2 className="subtitle">❤️ Why SuLife?</h2>
        <p className="text slide-up">
          Every moment counts. SuLife strives to save lives, enhance medical coordination, and give hope to families through technology-driven healthcare solutions.
        </p>

        {/* ✅ Back Button at the bottom */}
        <div className="back-btn-container">
          <button className="back-btn" onClick={() => navigate("/")}>
            ⬅ Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
