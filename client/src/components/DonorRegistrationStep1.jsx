// src/components/DonorRegistrationStep1.jsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./DonorStep1.css";
import backgroundImage from "../assets/login.jpg";
import { DonorContext } from "../context/DonorContext";

const DonorRegistrationStep1 = () => {
  const { donorData, setDonorData } = useContext(DonorContext);

  const [formData, setFormData] = useState({
    firstName: donorData.personalDetails.firstName || "",
    lastName: donorData.personalDetails.lastName || "",
    dob: donorData.personalDetails.dob || "",
    age: donorData.personalDetails.age || "",
    gender: donorData.personalDetails.gender || "",
    email: donorData.personalDetails.email || "",
    phone: donorData.personalDetails.phone || "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Age calculation
  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age >= 0 ? age : "";
  };

  useEffect(() => {
    if (formData.dob) {
      setFormData((prevData) => ({
        ...prevData,
        age: calculateAge(prevData.dob),
      }));
    }
  }, [formData.dob]);

  // Validation
  const validate = () => {
    let tempErrors = {};
    if (!formData.firstName) tempErrors.firstName = "First name is required.";
    if (!formData.lastName) tempErrors.lastName = "Last name is required.";
    if (!formData.dob) {
      tempErrors.dob = "Date of birth is required.";
    } else if (formData.age && formData.age < 18) {
      tempErrors.dob = "You must be at least 18 years old to register.";
    }
    if (!formData.gender) tempErrors.gender = "Gender is required.";
    if (!formData.email) {
      tempErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Email is not valid.";
    }
    if (!formData.phone) {
      tempErrors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      tempErrors.phone = "Phone number must be 10 digits.";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Save to global context
      setDonorData((prev) => ({
        ...prev,
        personalDetails: { ...formData },
      }));
      navigate("/register/donor/step2");
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
        <p className="form-subtitle">Step 1: Personal Details</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
            />
            {errors.firstName && <p className="error">{errors.firstName}</p>}
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
            />
            {errors.lastName && <p className="error">{errors.lastName}</p>}
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
            />
            {errors.dob && <p className="error">{errors.dob}</p>}
          </div>

          <div className="form-group">
            <label>Age</label>
            <input
              type="text"
              name="age"
              value={formData.age}
              readOnly
              className="readonly-field"
            />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <div className="gender-options-inline">
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={formData.gender === "Male"}
                  onChange={handleChange}
                />{" "}
                Male
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={formData.gender === "Female"}
                  onChange={handleChange}
                />{" "}
                Female
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="Other"
                  checked={formData.gender === "Other"}
                  onChange={handleChange}
                />{" "}
                Other
              </label>
            </div>
            {errors.gender && <p className="error">{errors.gender}</p>}
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
            {errors.email && <p className="error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your 10-digit phone number"
            />
            {errors.phone && <p className="error">{errors.phone}</p>}
          </div>

          <button type="submit" className="next-button">
            Next
          </button>
        </form>
      </div>
    </div>
  );
};

export default DonorRegistrationStep1;
