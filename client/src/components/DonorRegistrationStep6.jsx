// src/components/DonorRegistrationStep6.jsx
import React, { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./DonorStep6.css";
import backgroundImage from "../assets/login.jpg";
import { DonorContext } from "../context/DonorContext";

const DonorRegistrationStep6 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { donorData, setDonorData } = useContext(DonorContext);

  const isOrganDonor = location.state?.isOrganDonor || false;

  const [formData, setFormData] = useState({
    medicalReports: null,
    consentChecked: false,
  });

  const [errors, setErrors] = useState({});
  const [donorId, setDonorId] = useState(null);

  const handleFileChange = (e) => {
    const { files } = e.target;
    setFormData({ ...formData, medicalReports: files[0] });
  };

  const handleCheckboxChange = (e) => {
    setFormData({ ...formData, consentChecked: e.target.checked });
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.consentChecked) {
      tempErrors.consentChecked = "You must agree to the consent form.";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        // ✅ Merge everything from Steps 1–5 + Step 6
        // src/components/DonorRegistrationStep6.jsx
const finalData = {
  personalDetails: donorData.personalDetails || {},
  medicalDetails: donorData.medicalDetails || {},
  nomineeDetails: donorData.nomineeDetails || {},
  donationType: {
    blood: { agreed: donorData.donationType?.blood?.agreed || false },
    livingOrgans: donorData.donationType?.livingOrgans?.map((o) => o.name) || [],
    posthumousOrgans: donorData.donationType?.posthumousOrgans?.map((o) => o.name) || [],
  },
  consent: {
    consentChecked: formData.consentChecked,
  },
};



        const payload = new FormData();
        payload.append("data", JSON.stringify(finalData));
        if (formData.medicalReports) {
          payload.append("medicalReports", formData.medicalReports);
        }

        const res = await fetch("http://localhost:5000/api/donors/register", {
          method: "POST",
          body: payload,
        });

        const result = await res.json();
        console.log("✅ Server response:", result);

        if (res.ok && result.donorId) {
          setDonorId(result.donorId);

          // ✅ reset context after success
          setDonorData({
            donorId: "",
            personalDetails: {},
            medicalDetails: {},
            nomineeDetails: {},
            donationType: {},
            consent: {},
            medicalReports: null,
          });

          setTimeout(() => {
            navigate("/login");
          }, 4000);
        } else {
          if (res.status === 400) {
            alert(result.message || "Email already exists. Please try with another.");
          } else {
            alert(result.message || "Something went wrong.");
          }
        }
      } catch (err) {
        console.error(err);
        alert("Error while submitting registration.");
      }
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

        {!donorId ? (
          <>
            <p className="form-subtitle">
              Step 6 – Consent & Upload Medical Reports
            </p>

            <div className="consent-box">
              <label>
                <input
                  type="checkbox"
                  checked={formData.consentChecked}
                  onChange={handleCheckboxChange}
                />{" "}
                I hereby provide my consent for{" "}
                {isOrganDonor ? (
                  <strong>organ donation (posthumous)</strong>
                ) : (
                  <strong>blood / living donation</strong>
                )}{" "}
                and acknowledge that my medical reports will be used for
                verification purposes.
              </label>
              {errors.consentChecked && (
                <p className="error">{errors.consentChecked}</p>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Medical Reports (optional)</label>
                <label className="file-upload">
                  <span>📂 Click to upload Medical Certificate</span>
                  <input
                    type="file"
                    name="medicalReports"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                  {formData.medicalReports && (
                    <p className="file-name">{formData.medicalReports.name}</p>
                  )}
                </label>
              </div>

              <button type="submit" className="next-button">
                Submit & Generate DonorID
              </button>
            </form>
          </>
        ) : (
          <div className="success-box">
            <div className="checkmark-animation">✔</div>
            <h1 className="thank-you-text">Thank You for Giving Life ❤️</h1>
            <p className="form-subtitle">Your Donor ID is:</p>
            <h2 className="donor-id">{donorId}</h2>
            <p className="donation-quote">
              “The gift of life is the most precious gift of all. Through your
              donation, hope lives on.”
            </p>
            <p>You will be redirected to login shortly...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorRegistrationStep6;
