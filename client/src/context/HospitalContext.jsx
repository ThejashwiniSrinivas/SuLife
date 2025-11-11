// src/context/HospitalContext.jsx
import React, { createContext, useState } from "react";

export const HospitalContext = createContext();

export const HospitalProvider = ({ children }) => {
  const [hospitalData, setHospitalData] = useState({
    hospitalName: "",
    registrationNumber: "",
    ownership: "",
    city: "",
    state: "",
    pincode: "",
    hospitalEmail: "",
    hospitalPhone: "",
    authorizedName: "",
    authorizedDesignation: "",
    authorizedPhone: "",
    authorizedEmail: "",
    password: "",
    confirmPassword: "",
    licenseCertificate: null,
  });

  return (
    <HospitalContext.Provider value={{ hospitalData, setHospitalData }}>
      {children}
    </HospitalContext.Provider>
  );
};
