// src/components/DonorRegistrationStep2.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./DonorStep2.css";
import backgroundImage from "../assets/login.jpg";
import { DonorContext } from "../context/DonorContext";

const DonorRegistrationStep2 = () => {
  const { donorData, setDonorData } = useContext(DonorContext);

  const [formData, setFormData] = useState({
    address1: donorData.personalDetails.addressLine1 || "",
    address2: donorData.personalDetails.addressLine2 || "",
    city: donorData.personalDetails.city || "",
    state: donorData.personalDetails.state || "",
    pinCode: donorData.personalDetails.pincode || "",
    password: donorData.personalDetails.password || "",
    confirmPassword: donorData.personalDetails.confirmPassword || "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.address1) tempErrors.address1 = "Address is required.";
    if (!formData.city) tempErrors.city = "City is required.";
    if (!formData.state) tempErrors.state = "State is required.";
    if (!formData.pinCode) {
      tempErrors.pinCode = "PIN code is required.";
    } else if (!/^\d{6}$/.test(formData.pinCode)) {
      tempErrors.pinCode = "PIN code must be 6 digits.";
    }
    if (!formData.password) {
      tempErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters.";
    }
    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // ✅ Save everything into personalDetails (backend-compatible)
      setDonorData((prev) => ({
        ...prev,
        personalDetails: {
          ...prev.personalDetails,
          addressLine1: formData.address1,
          addressLine2: formData.address2,
          city: formData.city,
          state: formData.state,
          pincode: formData.pinCode,
          password: formData.password, // password stays in personalDetails
        },
      }));

      navigate("/register/donor/step3");
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
        <p className="form-subtitle">Step 2: Address & Account Details</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Address Line 1</label>
            <input
              type="text"
              name="address1"
              value={formData.address1}
              onChange={handleChange}
              placeholder="Enter your address"
            />
            {errors.address1 && <p className="error">{errors.address1}</p>}
          </div>

          <div className="form-group">
            <label>Address Line 2 (Optional)</label>
            <input
              type="text"
              name="address2"
              value={formData.address2}
              onChange={handleChange}
              placeholder="Apartment, suite, etc."
            />
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
              />
              {errors.city && <p className="error">{errors.city}</p>}
            </div>

            <div className="form-group half-width">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
              />
              {errors.state && <p className="error">{errors.state}</p>}
            </div>
          </div>

          <div className="form-group">
            <label>PIN Code</label>
            <input
              type="tel"
              name="pinCode"
              value={formData.pinCode}
              onChange={handleChange}
              placeholder="6-digit PIN"
            />
            {errors.pinCode && <p className="error">{errors.pinCode}</p>}
          </div>

          <div className="form-row">
            <div className="form-group half-width">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create password"
              />
              {errors.password && <p className="error">{errors.password}</p>}
            </div>

            <div className="form-group half-width">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
              />
              {errors.confirmPassword && (
                <p className="error">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <button type="submit" className="next-button">
            Next
          </button>
        </form>
      </div>
    </div>
  );
};

export default DonorRegistrationStep2;
