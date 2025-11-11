// src/components/hospital/ThankYouPage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ThankYouPage.css";
import bgImage from "../assets/doctor.jpg";

const ThankYouPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 4000); // Redirect after 4 seconds
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="thankyou-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="thankyou-overlay"></div>
      <div className="thankyou-content">
        <h1 className="thankyou-title">✅ Thank You for Registering!</h1>
        <p className="thankyou-msg">
          Your hospital registration has been successfully submitted.
        </p>
        <p className="thankyou-redirect">
          You will be redirected to the login page shortly...
        </p>
      </div>
    </div>
  );
};

export default ThankYouPage;
