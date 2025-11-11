// src/components/hospital/HospitalRegistrationStep1.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./HospitalStep1.css";
import Navbar from "./Navbar";
import bgImage from "../assets/doctor.jpg";

// ✅ Import Hospital Context
import { HospitalContext } from "../context/HospitalContext";

const HospitalRegistrationStep1 = () => {
  const navigate = useNavigate();
  const { hospitalData, setHospitalData } = useContext(HospitalContext);

  // Local error state
  const [errors, setErrors] = useState({});

  // ✅ validation
  const validate = () => {
    let newErrors = {};
    if (!hospitalData.hospitalName.trim())
      newErrors.hospitalName = "Hospital name is required";
    if (!hospitalData.registrationNumber.trim())
      newErrors.registrationNumber = "Registration number is required";
    if (!hospitalData.ownership)
      newErrors.ownership = "Please select ownership type";
    if (!hospitalData.city.trim()) newErrors.city = "City is required";
    if (!hospitalData.state.trim()) newErrors.state = "State is required";
    if (!hospitalData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(hospitalData.pincode)) {
      newErrors.pincode = "Enter a valid 6-digit pincode";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ update context using setHospitalData
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
      console.log("Hospital Data Step 1:", hospitalData);
      navigate("/hospital/step2"); // ✅ next step route
    }
  };

  return (
    <div
      className="hospital-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="hospital-overlay"></div>
      <Navbar />

      <div className="hospital-content">
        <h1 className="hospital-title">Hospital Registration</h1>
        <h2 className="hospital-subtitle">Step 1: Hospital Info</h2>

        <form onSubmit={handleSubmit} className="hospital-form">
          {/* Hospital Name */}
          <div className="hospital-form-group">
            <label>Hospital Name *</label>
            <input
              type="text"
              name="hospitalName"
              value={hospitalData.hospitalName}
              onChange={handleChange}
              placeholder="Enter hospital name"
            />
            {errors.hospitalName && (
              <p className="hospital-error">{errors.hospitalName}</p>
            )}
          </div>

          {/* Registration Number */}
          <div className="hospital-form-group">
            <label>Registration Number *</label>
            <input
              type="text"
              name="registrationNumber"
              value={hospitalData.registrationNumber}
              onChange={handleChange}
              placeholder="Govt / Medical Council License Number"
            />
            {errors.registrationNumber && (
              <p className="hospital-error">{errors.registrationNumber}</p>
            )}
          </div>

          {/* Ownership */}
          <div className="hospital-form-group">
            <label>Ownership *</label>
            <div className="hospital-radio-group">
              {["Government", "Private", "Trust", "NGO"].map((option) => (
                <label key={option} className="hospital-radio-label">
                  <input
                    type="radio"
                    name="ownership"
                    value={option}
                    checked={hospitalData.ownership === option}
                    onChange={handleChange}
                  />
                  {option}
                </label>
              ))}
            </div>
            {errors.ownership && (
              <p className="hospital-error">{errors.ownership}</p>
            )}
          </div>

          {/* Address */}
          <div className="hospital-form-row">
            <div className="hospital-form-group">
              <label>City *</label>
              <input
                type="text"
                name="city"
                value={hospitalData.city}
                onChange={handleChange}
                placeholder="Enter city"
              />
              {errors.city && <p className="hospital-error">{errors.city}</p>}
            </div>

            <div className="hospital-form-group">
              <label>State *</label>
              <input
                type="text"
                name="state"
                value={hospitalData.state}
                onChange={handleChange}
                placeholder="Enter state"
              />
              {errors.state && <p className="hospital-error">{errors.state}</p>}
            </div>

            <div className="hospital-form-group">
              <label>Pincode *</label>
              <input
                type="text"
                name="pincode"
                value={hospitalData.pincode}
                onChange={handleChange}
                placeholder="Enter pincode"
              />
              {errors.pincode && (
                <p className="hospital-error">{errors.pincode}</p>
              )}
            </div>
          </div>

          <button type="submit" className="hospital-next-btn">
            Next →
          </button>
        </form>
      </div>
    </div>
  );
};

export default HospitalRegistrationStep1;
