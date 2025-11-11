// src/components/DonorRegistrationStep4.jsx
import React, { useState, useContext } from "react";
import Navbar from "./Navbar";
import "./DonorStep4.css";
import backgroundImage from "../assets/login.jpg";
import { useNavigate } from "react-router-dom";
import { DonorContext } from "../context/DonorContext";

const DonorRegistrationStep4 = () => {
  const { donorData, setDonorData } = useContext(DonorContext);

  const [formData, setFormData] = useState({
    bloodDonation: donorData.donationType?.isBloodDonor || false,
    livingOrganDonation: donorData.donationType?.organs?.some(
      (o) => o.type === "living"
    ) || false,
    livingOrgans:
      donorData.donationType?.organs?.filter((o) => o.type === "living").map((o) => o.name) || [],
    posthumousOrganDonation: donorData.donationType?.organs?.some(
      (o) => o.type === "posthumous"
    ) || false,
    posthumousOrgans:
      donorData.donationType?.organs?.filter((o) => o.type === "posthumous").map((o) => o.name) || [],
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleOrganChange = (e) => {
    const { name, value, checked } = e.target;
    if (checked) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: [...prevData[name], value],
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: prevData[name].filter((organ) => organ !== value),
      }));
    }
  };

  const validate = () => {
    let tempErrors = {};
    if (
      !formData.bloodDonation &&
      !formData.livingOrganDonation &&
      !formData.posthumousOrganDonation
    ) {
      tempErrors.donationPreference =
        "You must select at least one donation option.";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

 const handleSubmit = (e) => {
  e.preventDefault();
  if (validate()) {
    // Transform organs to correct backend shape
    const livingOrgansObjects = formData.livingOrgans.map((organ) => ({
      name: organ,      // organ name
      type: "living",   // type as per enum
    }));

    const posthumousOrgansObjects = formData.posthumousOrgans.map((organ) => ({
      name: organ,
      type: "posthumous",
    }));

    // Save to DonorContext in correct shape
    setDonorData((prev) => ({
  ...prev,
  donationType: {
    blood: { agreed: formData.bloodDonation },
    livingOrgans: formData.livingOrgans.map((o) => ({ name: o })),
    posthumousOrgans: formData.posthumousOrgans.map((o) => ({ name: o })),
  },
}));


    // Navigate
    if (formData.posthumousOrganDonation) {
      navigate("/register/donor/step5", { state: { posthumousSelected: true } });
    } else {
      navigate("/register/donor/step6", { state: { isOrganDonor: formData.livingOrganDonation } });
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
        <p className="form-subtitle">Step 4: Donation Preferences</p>

        <form onSubmit={handleSubmit}>
          {/* Blood Donation */}
          <div className="form-group">
            <label>Blood Donation</label>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="bloodDonation"
                  checked={formData.bloodDonation}
                  onChange={handleCheckboxChange}
                />{" "}
                I am willing to donate blood.
              </label>
            </div>
          </div>

          {/* Living Organ Donation */}
          <div className="form-group">
            <label>Organ Donation (Living)</label>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="livingOrganDonation"
                  checked={formData.livingOrganDonation}
                  onChange={handleCheckboxChange}
                />{" "}
                I am willing to be a living organ donor.
              </label>
            </div>

            {formData.livingOrganDonation && (
              <div
                className="checkbox-group"
                style={{ marginLeft: "20px", marginTop: "10px" }}
              >
                <label>Choose organ(s):</label>
                <label>
                  <input
                    type="checkbox"
                    name="livingOrgans"
                    value="Kidney"
                    checked={formData.livingOrgans.includes("Kidney")}
                    onChange={handleOrganChange}
                  />{" "}
                  Kidney
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="livingOrgans"
                    value="Partial Liver"
                    checked={formData.livingOrgans.includes("Partial Liver")}
                    onChange={handleOrganChange}
                  />{" "}
                  Partial Liver
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="livingOrgans"
                    value="Bone Marrow"
                    checked={formData.livingOrgans.includes("Bone Marrow")}
                    onChange={handleOrganChange}
                  />{" "}
                  Bone Marrow
                </label>
              </div>
            )}
          </div>

          {/* Posthumous Organ Donation */}
          <div className="form-group">
            <label>Organ Donation (Posthumous)</label>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="posthumousOrganDonation"
                  checked={formData.posthumousOrganDonation}
                  onChange={handleCheckboxChange}
                />{" "}
                I am willing to donate organs after death.
              </label>
            </div>

            {formData.posthumousOrganDonation && (
              <div
                className="checkbox-group"
                style={{ marginLeft: "20px", marginTop: "10px" }}
              >
                <label>Choose organ(s):</label>
                <label>
                  <input
                    type="checkbox"
                    name="posthumousOrgans"
                    value="Heart"
                    checked={formData.posthumousOrgans.includes("Heart")}
                    onChange={handleOrganChange}
                  />{" "}
                  Heart
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="posthumousOrgans"
                    value="Lungs"
                    checked={formData.posthumousOrgans.includes("Lungs")}
                    onChange={handleOrganChange}
                  />{" "}
                  Lungs
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="posthumousOrgans"
                    value="Pancreas"
                    checked={formData.posthumousOrgans.includes("Pancreas")}
                    onChange={handleOrganChange}
                  />{" "}
                  Pancreas
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="posthumousOrgans"
                    value="Cornea"
                    checked={formData.posthumousOrgans.includes("Cornea")}
                    onChange={handleOrganChange}
                  />{" "}
                  Cornea
                </label>
              </div>
            )}
          </div>

          {/* Error */}
          {errors.donationPreference && (
            <p className="error">{errors.donationPreference}</p>
          )}

          <button type="submit" className="next-button">
            Next
          </button>
        </form>
      </div>
    </div>
  );
};

export default DonorRegistrationStep4;
