import React, { createContext, useState } from "react";

// ✅ Only named exports
export const DonorContext = createContext();

export const DonorProvider = ({ children }) => {
  const [donorData, setDonorData] = useState({
    donorId: "",
    personalDetails: {
      firstName: "",
      lastName: "",
      age: "",
      gender: "",
      phone: "",
      email: "",
      password: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
    },
    medicalDetails: {
      bloodGroup: "",
      medicalHistory: [],
      existingConditions: "",
    },
    nomineeDetails: {
      name: "",
      relation: "",
      phone: "",
      email: "",
      address: "",
    },
    donationType: {
      isOrganDonor: false,
      isBloodDonor: false,
    },
    consent: {
      agreed: false,
    },
    medicalReports: null,
  });

  return (
    <DonorContext.Provider value={{ donorData, setDonorData }}>
      {children}
    </DonorContext.Provider>
  );
};
