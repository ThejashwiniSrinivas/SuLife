// src/components/hospital/HospitalRegistrationStep3.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./HospitalStep3.css";
import Navbar from "./Navbar";
import bgImage from "../assets/doctor.jpg";

// ✅ Import Hospital Context
import { HospitalContext } from "../context/HospitalContext";

const HospitalRegistrationStep3 = () => {
  const navigate = useNavigate();
  const { hospitalData, setHospitalData } = useContext(HospitalContext);

  const [errors, setErrors] = useState({});

  // ✅ validation
  const validate = () => {
    let newErrors = {};

    if (!hospitalData.password?.trim()) {
      newErrors.password = "Password is required";
    } else if (hospitalData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!hospitalData.confirmPassword?.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (hospitalData.password !== hospitalData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!hospitalData.licenseCertificate) {
      newErrors.licenseCertificate = "License certificate is required";
    } else if (
      hospitalData.licenseCertificate.type !== "application/pdf" &&
      !hospitalData.licenseCertificate.type.startsWith("image/")
    ) {
      newErrors.licenseCertificate =
        "Only PDF or image files (JPG, PNG) are allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ update context for text inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setHospitalData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ update context for file input
  const handleFileChange = (e) => {
    setHospitalData((prev) => ({
      ...prev,
      licenseCertificate: e.target.files[0],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log("Hospital Data Step 3:", hospitalData);
      navigate("/hospital/step4");
    }
  };

  return (
    <div
      className="hospital3-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="hospital3-overlay"></div>
      <Navbar />

      <div className="hospital3-content">
        <h1 className="hospital3-title">Hospital Registration</h1>
        <h2 className="hospital3-subtitle">
          Step 3: Login Credentials & Documents Upload
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Password */}
          <div className="hospital3-form-group">
            <label>Password *</label>
            <input
              type="password"
              name="password"
              value={hospitalData.password || ""}
              onChange={handleChange}
              placeholder="Enter password"
            />
            {errors.password && (
              <p className="hospital3-error">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="hospital3-form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={hospitalData.confirmPassword || ""}
              onChange={handleChange}
              placeholder="Re-enter password"
            />
            {errors.confirmPassword && (
              <p className="hospital3-error">{errors.confirmPassword}</p>
            )}
          </div>

          {/* License Certificate Upload */}
          <div className="hospital3-form-group">
            <label>Upload License Certificate (PDF / Image) *</label>

            {/* Hidden file input */}
            <input
              type="file"
              id="licenseCertificate"
              accept=".pdf, image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {/* Custom clickable label */}
            <label htmlFor="licenseCertificate" className="hospital3-upload-btn">
              {hospitalData.licenseCertificate
                ? hospitalData.licenseCertificate.name
                : "📂 Choose File"}
            </label>

            {errors.licenseCertificate && (
              <p className="hospital3-error">{errors.licenseCertificate}</p>
            )}
          </div>

          <button type="submit" className="hospital3-next-btn">
            Next →
          </button>
        </form>
      </div>
    </div>
  );
};

export default HospitalRegistrationStep3;
