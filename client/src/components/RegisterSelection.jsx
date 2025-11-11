import React from "react";
import { useNavigate } from "react-router-dom";
import donorImg from "../assets/donorcard.jpg";
import hospitalImg from "../assets/hospitalcard.jpg";
import adminImg from "../assets/admincard.jpg";
import Navbar from "./Navbar";   // ✅ import
import "./RegisterSelection.css";

const RegisterSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="rs-container">
      {/* ✅ Navbar at top-left */}
      <Navbar />

      <h1 className="rs-title">Choose Your Role</h1>

      {/* Role Cards */}
      <div className="rs-grid">
        {/* Donor Card */}
        <div className="rs-card">
          <div className="rs-imgWrap">
            <img src={donorImg} alt="Donor" className="rs-img" />
          </div>
          <h2 className="rs-cardHeading">Donor</h2>
          <button
            className="rs-primaryBtn"
            onClick={() => navigate("/register/donor")}
          >
            Register as Donor
          </button>
        </div>

        {/* Hospital Card */}
        <div className="rs-card">
          <div className="rs-imgWrap">
            <img src={hospitalImg} alt="Hospital" className="rs-img" />
          </div>
          <h2 className="rs-cardHeading">Hospital</h2>
          <button
            className="rs-primaryBtn"
            onClick={() => navigate("/hospital/step1")}
          >
            Register as Hospital
          </button>
        </div>

        {/*Admin Card*/}
        <div className="rs-card">
          <div className="rs-imgWrap">
            <img src={adminImg} alt="Admin" className="rs-img" />
          </div>
          <h2 className="rs-cardHeading">Admin</h2>
          <button
            className="rs-primaryBtn"
            onClick={() => navigate("/admin/login")}
          >
            Login as Admin
          </button>
        </div>
      </div>

      {/* Already Registered */}
      <div className="login-section">
        <p>Already registered?</p>
        <button className="rs-secondaryBtn" onClick={() => navigate("/login")}>
          Login
        </button>
      </div>

      {/* Back Button */}
      <div className="back-section">
        <button className="rs-backBtn" onClick={() => navigate("/")}>
          ⬅ Back to Landing
        </button>
      </div>
    </div>
  );
};

export default RegisterSelection;
