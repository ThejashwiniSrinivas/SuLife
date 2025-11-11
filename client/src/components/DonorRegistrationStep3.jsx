// src/components/DonorRegistrationStep3.jsx
import React, { useState, useContext } from "react";
import Navbar from "./Navbar";
import "./DonorStep3.css";
import backgroundImage from "../assets/login.jpg";
import { useNavigate } from "react-router-dom";
import { DonorContext } from "../context/DonorContext";

const DonorRegistrationStep3 = () => {
  const { donorData, setDonorData } = useContext(DonorContext);

  const [formData, setFormData] = useState({
    bloodGroup: donorData.medicalDetails.bloodGroup || "",
    medicalHistory: donorData.medicalDetails.medicalHistory || [],
    existingConditions: donorData.medicalDetails.existingConditions || "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      const newMedicalHistory = checked
        ? [...formData.medicalHistory, value]
        : formData.medicalHistory.filter((item) => item !== value);
      setFormData({ ...formData, medicalHistory: newMedicalHistory });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.bloodGroup) tempErrors.bloodGroup = "Blood group is required.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // ✅ Save into global context
      setDonorData((prev) => ({
        ...prev,
        medicalDetails: {
          bloodGroup: formData.bloodGroup,
          medicalHistory: formData.medicalHistory,
          existingConditions: formData.existingConditions,
        },
      }));

      navigate("/register/donor/step4");
    }
  };

  return (
    <div
      className="form-container"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <Navbar />

      <div className="form-content">
        <h2 className="form-title">Donor Registration</h2>
        <p className="form-subtitle">Step 3: Medical Details</p>

        <form onSubmit={handleSubmit}>
          {/* Blood Group Dropdown */}
          <div className="form-group">
            <label>Blood Group</label>
            <select
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              className="input-select"
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
            {errors.bloodGroup && <p className="error">{errors.bloodGroup}</p>}
          </div>

          {/* Medical History Checkboxes */}
          <div className="form-group">
            <label>Medical History</label>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="medicalHistory"
                  value="Diabetes"
                  checked={formData.medicalHistory.includes("Diabetes")}
                  onChange={handleChange}
                />{" "}
                Diabetes
              </label>
              <label>
                <input
                  type="checkbox"
                  name="medicalHistory"
                  value="Hypertension"
                  checked={formData.medicalHistory.includes("Hypertension")}
                  onChange={handleChange}
                />{" "}
                Hypertension
              </label>
              <label>
                <input
                  type="checkbox"
                  name="medicalHistory"
                  value="Heart Disease"
                  checked={formData.medicalHistory.includes("Heart Disease")}
                  onChange={handleChange}
                />{" "}
                Heart Disease
              </label>
            </div>
          </div>

          {/* Existing Conditions Textarea */}
          <div className="form-group">
            <label>Existing Conditions (Optional)</label>
            <textarea
              name="existingConditions"
              value={formData.existingConditions}
              onChange={handleChange}
              placeholder="List any existing medical conditions or allergies"
              rows="4"
              className="input-textarea"
            />
          </div>

          <button type="submit" className="next-button">
            Next
          </button>
        </form>
      </div>
    </div>
  );
};

export default DonorRegistrationStep3;
