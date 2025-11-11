// DonorRegistrationStep5.jsx
import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import "./DonorStep4.css"; // reuse same CSS
import backgroundImage from "../assets/login.jpg";
import { DonorContext } from "../context/DonorContext";

const DonorRegistrationStep5 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { donorData, setDonorData } = useContext(DonorContext);

  // 👇 from Step 4 we know this is only for posthumous donors
  const posthumousSelected = location.state?.posthumousSelected || false;

  const [formData, setFormData] = useState({
    nomineeName: donorData.nomineeDetails?.name || "",
    nomineeRelation: donorData.nomineeDetails?.relation || "",
    nomineePhone: donorData.nomineeDetails?.phone || "",
    nomineeEmail: donorData.nomineeDetails?.email || "",
    nomineeAddress: donorData.nomineeDetails?.address || "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.nomineeName) tempErrors.nomineeName = "Full name is required.";
    if (!formData.nomineeRelation)
      tempErrors.nomineeRelation = "Relationship is required.";
    if (!formData.nomineePhone) {
      tempErrors.nomineePhone = "Contact number is required.";
    } else if (!/^\d{10}$/.test(formData.nomineePhone)) {
      tempErrors.nomineePhone = "Contact number must be 10 digits.";
    }
    if (
      formData.nomineeEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.nomineeEmail)
    ) {
      tempErrors.nomineeEmail = "Invalid email format.";
    }
    if (!formData.nomineeAddress)
      tempErrors.nomineeAddress = "Address is required.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // ✅ Save nominee data into Context with correct keys
      setDonorData((prev) => ({
        ...prev,
        nomineeDetails: {
          name: formData.nomineeName,
          relation: formData.nomineeRelation,
          phone: formData.nomineePhone,
          email: formData.nomineeEmail,
          address: formData.nomineeAddress,
        },
      }));

      // ✅ Always go to Step 6 with isOrganDonor true (since this is Posthumous organ donation)
      navigate("/register/donor/step6", {
        state: { isOrganDonor: true },
      });
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
        <p className="form-subtitle">
          Step 5 – Nominee (only if Posthumous selected)
        </p>

        <form onSubmit={handleSubmit}>
          {/* Nominee Full Name */}
          <div className="form-group">
            <label>Nominee Full Name</label>
            <input
              type="text"
              name="nomineeName"
              value={formData.nomineeName}
              onChange={handleChange}
              placeholder="Enter nominee's full name"
            />
            {errors.nomineeName && <p className="error">{errors.nomineeName}</p>}
          </div>

          {/* Relationship */}
          <div className="form-group">
            <label>Relationship</label>
            <input
              type="text"
              name="nomineeRelation"
              value={formData.nomineeRelation}
              onChange={handleChange}
              placeholder="Enter relationship"
            />
            {errors.nomineeRelation && (
              <p className="error">{errors.nomineeRelation}</p>
            )}
          </div>

          {/* Contact Number */}
          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="tel"
              name="nomineePhone"
              value={formData.nomineePhone}
              onChange={handleChange}
              placeholder="Enter 10-digit contact number"
            />
            {errors.nomineePhone && (
              <p className="error">{errors.nomineePhone}</p>
            )}
          </div>

          {/* Email (optional) */}
          <div className="form-group">
            <label>Email (Optional)</label>
            <input
              type="email"
              name="nomineeEmail"
              value={formData.nomineeEmail}
              onChange={handleChange}
              placeholder="Enter nominee's email"
            />
            {errors.nomineeEmail && (
              <p className="error">{errors.nomineeEmail}</p>
            )}
          </div>

          {/* Address */}
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="nomineeAddress"
              value={formData.nomineeAddress}
              onChange={handleChange}
              placeholder="Enter nominee's address"
            />
            {errors.nomineeAddress && (
              <p className="error">{errors.nomineeAddress}</p>
            )}
          </div>

          <button type="submit" className="next-button">
            Next
          </button>
        </form>
      </div>
    </div>
  );
};

export default DonorRegistrationStep5;
