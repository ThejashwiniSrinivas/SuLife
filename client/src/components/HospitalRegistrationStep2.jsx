// src/components/hospital/HospitalRegistrationStep2.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./HospitalStep2.css";
import Navbar from "./Navbar";
import bgImage from "../assets/doctor.jpg";

// ✅ Import Hospital Context
import { HospitalContext } from "../context/HospitalContext";

const HospitalRegistrationStep2 = () => {
  const navigate = useNavigate();
  const { hospitalData, setHospitalData } = useContext(HospitalContext);

  const [errors, setErrors] = useState({});

  // ✅ Validation
  // ✅ Validation
const validate = () => {
  let newErrors = {};

  // Hospital Email
  if (!hospitalData.hospitalEmail.trim()) {
    newErrors.hospitalEmail = "Official hospital email is required";
  } else if (!/\S+@\S+\.\S+/.test(hospitalData.hospitalEmail)) {
    newErrors.hospitalEmail = "Enter a valid email";
  }

  // Hospital Phone: exactly 10 digits
  if (!hospitalData.hospitalPhone.trim()) {
    newErrors.hospitalPhone = "Hospital phone is required";
  } else if (!/^\d{10}$/.test(hospitalData.hospitalPhone)) {
    newErrors.hospitalPhone = "Enter a valid 10-digit phone number";
  }

  // Authorized Name
  if (!hospitalData.authorizedName.trim()) {
    newErrors.authorizedName = "Authorized person name is required";
  }

  // Designation
  if (!hospitalData.authorizedDesignation.trim()) {
    newErrors.authorizedDesignation = "Designation is required";
  }

  // Authorized Phone: exactly 10 digits
  if (!hospitalData.authorizedPhone.trim()) {
    newErrors.authorizedPhone = "Authorized contact no. is required";
  } else if (!/^\d{10}$/.test(hospitalData.authorizedPhone)) {
    newErrors.authorizedPhone = "Enter a valid 10-digit phone number";
  }

  // Authorized Email
  if (!hospitalData.authorizedEmail.trim()) {
    newErrors.authorizedEmail = "Authorized email is required";
  } else if (!/\S+@\S+\.\S+/.test(hospitalData.authorizedEmail)) {
    newErrors.authorizedEmail = "Enter a valid email";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


  // ✅ update context instead of local state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setHospitalData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log("Hospital Data Step 2:", hospitalData);
      navigate("/hospital/step3");
    }
  };

  return (
    <div
      className="hospital2-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="hospital2-overlay"></div>
      <Navbar />

      <div className="hospital2-content">
        <h1 className="hospital2-title">Hospital Registration</h1>
        <h2 className="hospital2-subtitle">
          Step 2: Contact Info & Authorized Person
        </h2>

        <form onSubmit={handleSubmit} className="hospital2-form">
          {/* Hospital Email */}
          <div className="hospital2-form-group">
            <label>Official Hospital Email *</label>
            <input
              type="email"
              name="hospitalEmail"
              value={hospitalData.hospitalEmail}
              onChange={handleChange}
              placeholder="Enter official hospital email"
            />
            {errors.hospitalEmail && (
              <p className="hospital2-error">{errors.hospitalEmail}</p>
            )}
          </div>

          {/* Hospital Phone */}
          <div className="hospital2-form-group">
            <label>Hospital Phone (Landline / Primary) *</label>
            <input
              type="text"
              name="hospitalPhone"
              value={hospitalData.hospitalPhone}
              onChange={handleChange}
              placeholder="Enter hospital phone"
            />
            {errors.hospitalPhone && (
              <p className="hospital2-error">{errors.hospitalPhone}</p>
            )}
          </div>

          <h3 className="hospital2-subtitle">Authorized Person Details</h3>

          {/* Authorized Person Name */}
          <div className="hospital2-form-group">
            <label>Name *</label>
            <input
              type="text"
              name="authorizedName"
              value={hospitalData.authorizedName}
              onChange={handleChange}
              placeholder="Enter authorized person's name"
            />
            {errors.authorizedName && (
              <p className="hospital2-error">{errors.authorizedName}</p>
            )}
          </div>

          {/* Designation */}
          <div className="hospital2-form-group">
            <label>Designation *</label>
            <input
              type="text"
              name="authorizedDesignation"
              value={hospitalData.authorizedDesignation}
              onChange={handleChange}
              placeholder="Enter designation"
            />
            {errors.authorizedDesignation && (
              <p className="hospital2-error">{errors.authorizedDesignation}</p>
            )}
          </div>

          {/* Authorized Phone */}
          <div className="hospital2-form-group">
            <label>Contact No. *</label>
            <input
              type="text"
              name="authorizedPhone"
              value={hospitalData.authorizedPhone}
              onChange={handleChange}
              placeholder="Enter authorized contact number"
            />
            {errors.authorizedPhone && (
              <p className="hospital2-error">{errors.authorizedPhone}</p>
            )}
          </div>

          {/* Authorized Email */}
          <div className="hospital2-form-group">
            <label>Email ID *</label>
            <input
              type="email"
              name="authorizedEmail"
              value={hospitalData.authorizedEmail}
              onChange={handleChange}
              placeholder="Enter authorized email ID"
            />
            {errors.authorizedEmail && (
              <p className="hospital2-error">{errors.authorizedEmail}</p>
            )}
          </div>

          <button type="submit" className="hospital2-next-btn">
            Next →
          </button>
        </form>
      </div>
    </div>
  );
};

export default HospitalRegistrationStep2;
