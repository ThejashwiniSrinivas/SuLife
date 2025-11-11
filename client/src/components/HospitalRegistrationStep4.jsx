// src/components/hospital/HospitalRegistrationStep4.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./HospitalStep4.css";
import Navbar from "./Navbar";
import bgImage from "../assets/doctor.jpg";
import { HospitalContext } from "../context/HospitalContext"; // ✅ fixed path

const HospitalRegistrationStep4 = () => {
  const navigate = useNavigate();
  const { hospitalData } = useContext(HospitalContext);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!agreed) {
    setError("You must agree before submitting");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const formData = new FormData();

    // ✅ Add all text fields (including empty strings, except file)
    for (const key in hospitalData) {
      if (key !== "licenseCertificate") {
        formData.append(key, hospitalData[key] ?? ""); // use empty string if undefined
      }
    }

    // ✅ Add file separately (only if selected)
    if (hospitalData.licenseCertificate instanceof File) {
      formData.append("licenseCertificate", hospitalData.licenseCertificate);
    }

    console.log("Submitting Hospital Data:", hospitalData); // 🔍 debug log

    const res = await fetch("http://localhost:5000/api/hospital/register", {
      method: "POST",
      body: formData, // don't JSON.stringify!
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid server response");
    }

    if (!res.ok) {
      setError(data.message || "Registration failed");
      setLoading(false);
      return;
    }

    alert(`✅ Registered successfully! Hospital ID: ${data.hospitalId}`);
    navigate("/hospital/thank-you");
  } catch (err) {
    console.error("Submit Error:", err);
    setError(err.message || "Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div
      className="hospital4-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="hospital4-overlay"></div>
      <Navbar />

      <div className="hospital4-content">
        <h1 className="hospital4-title">Hospital Registration</h1>
        <h2 className="hospital4-subtitle">Step 4: Consent & Declaration</h2>

        <div className="hospital4-declaration">
          <p className="hospital4-quote">
            “We hereby declare that all information provided is true and
            authentic to the best of our knowledge.”
          </p>
          <p className="hospital4-quote">
            “We understand that any false information may lead to rejection of
            registration and legal action if required.”
          </p>
          <p className="hospital4-quote">
            “We consent to the use of our hospital’s data for verification and
            authorization purposes.”
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="hospital4-checkbox">
            <input
              type="checkbox"
              id="agreement"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                setError("");
              }}
            />
            <label htmlFor="agreement">
              I have read and agree to the above declaration
            </label>
          </div>
          {error && <p className="hospital4-error">{error}</p>}

          <button
            type="submit"
            className="hospital4-submit-btn"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HospitalRegistrationStep4;
