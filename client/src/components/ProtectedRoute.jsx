import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();

  // 🔍 Debug logs
  console.log("🔑 Token in storage:", token);
  console.log("👤 Role in storage:", `"${role}"`);
  console.log("✅ Allowed roles for this route:", allowedRoles);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn("🚫 Access denied! Role mismatch.");
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
