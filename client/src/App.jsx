import React from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import AboutUs from "./components/AboutUs";
import RegisterSelection from "./components/RegisterSelection";
import DonorRegistrationStep1 from "./components/DonorRegistrationStep1";
import DonorRegistrationStep2 from "./components/DonorRegistrationStep2";
import DonorRegistrationStep3 from "./components/DonorRegistrationStep3";
import DonorRegistrationStep4 from "./components/DonorRegistrationStep4";
import DonorRegistrationStep5 from "./components/DonorRegistrationStep5";
import DonorRegistrationStep6 from "./components/DonorRegistrationStep6";
import HospitalRegistrationStep1 from "./components/HospitalRegistrationStep1";
import HospitalRegistrationStep2 from "./components/HospitalRegistrationStep2";
import HospitalRegistrationStep3 from "./components/HospitalRegistrationStep3";
import HospitalRegistrationStep4 from "./components/HospitalRegistrationStep4";
import ThankYou from "./components/ThankYouPage.jsx";
import Login from "./components/Login.jsx";
import Unauthorized from "./components/Unauthorized.jsx";
import DonorDashboard from "./components/DonorDashboard";
import HospitalDashboard from "./components/HospitalDashboard";
import PatientConditionForm from "./components/PatientConditionForm";
import AdminLogin from "./components/AdminLogin.jsx";
import AdminDashboard from "./components/AdminDashboard";


// ✅ Context Providers
import { DonorProvider } from "./context/DonorContext.jsx";
import { HospitalProvider } from "./context/HospitalContext.jsx";

// ✅ ProtectedRoute
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <DonorProvider>
      <HospitalProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/register" element={<RegisterSelection />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* Donor Registration */}
          <Route path="/register/donor" element={<DonorRegistrationStep1 />} />
          <Route path="/register/donor/step2" element={<DonorRegistrationStep2 />} />
          <Route path="/register/donor/step3" element={<DonorRegistrationStep3 />} />
          <Route path="/register/donor/step4" element={<DonorRegistrationStep4 />} />
          <Route path="/register/donor/step5" element={<DonorRegistrationStep5 />} />
          <Route path="/register/donor/step6" element={<DonorRegistrationStep6 />} />

          {/* Hospital Registration */}
          <Route path="/register/hospital" element={<div>Hospital Registration Form</div>} />
          <Route path="/hospital/step1" element={<HospitalRegistrationStep1 />} />
          <Route path="/hospital/step2" element={<HospitalRegistrationStep2 />} />
          <Route path="/hospital/step3" element={<HospitalRegistrationStep3 />} />
          <Route path="/hospital/step4" element={<HospitalRegistrationStep4 />} />
          <Route path="/hospital/thank-you" element={<ThankYou />} />

          <Route path="/patients/:patientId/condition" element={<PatientConditionForm />} />

          {/* Role-based Dashboards */}
          <Route
            path="/donor/dashboard"
            element={
              <ProtectedRoute allowedRoles={["donor"]}>
                <DonorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hospital/dashboard"
            element={
              <ProtectedRoute allowedRoles={["hospital"]}>
                <HospitalDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Unauthorized & Login */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/login" element={<Login />} />
          
        </Routes>
      </HospitalProvider>
    </DonorProvider>
  );
};

export default App;
