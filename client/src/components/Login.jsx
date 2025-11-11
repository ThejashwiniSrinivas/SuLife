import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import bgImage from "../assets/bg.jpg";
import Navbar from "./Navbar";

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("donor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Handles redirection after login
  useEffect(() => {
    if (isLoggedIn) {
      const userRole = localStorage.getItem("role");
      console.log("🔄 Redirecting user with role:", userRole);

      if (userRole === "donor") {
        navigate("/donor/dashboard");
      } else if (userRole === "hospital") {
        navigate("/hospital/dashboard");
      } else if (userRole === "admin") {
        navigate("/admin/dashboard");
      }
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const endpointMap = {
        donor: "donors",
        hospital: "hospital",
        admin: "admin",
      };

      const res = await fetch(
        `http://localhost:5000/api/${endpointMap[role]}/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials");
        return;
      }

      // ✅ Store token & role (prefer backend role if provided)
      if (data.token) {
        localStorage.setItem("token", data.token);

        const finalRole = data.role
          ? data.role.toLowerCase()
          : role.toLowerCase();
        localStorage.setItem("role", finalRole);

        // ✅ Save donorId
        if (finalRole === "donor" && data.donorId) {
          localStorage.setItem("donorId", data.donorId);
          console.log("🆔 Saved donorId:", data.donorId);
        }

        // ✅ Save hospitalId & hospitalName
 if (finalRole === "hospital") {
        if (data.hospitalId) {
          localStorage.setItem("hospitalId", data.hospitalId);
          console.log("🏥 Saved hospitalId:", data.hospitalId);
        }

        // Properly get hospitalName from backend
        const name =
          data.hospitalName || (data.hospital && data.hospital.hospitalName);
        if (name) {
          localStorage.setItem("hospitalName", name);
          console.log("🏥 Saved hospitalName:", name);
        }
      }

        console.log("🔑 Token from backend:", data.token);
        console.log("👤 Role from backend:", data.role);
        console.log("📦 Final role saved in storage:", finalRole);
      }

      alert(`✅ Logged in as ${role.toUpperCase()}`);

      // 🚀 Navigate immediately based on final role
      const finalRole = localStorage.getItem("role");
      if (finalRole === "donor") navigate("/donor/dashboard");
      if (finalRole === "hospital") navigate("/hospital/dashboard");
      if (finalRole === "admin") navigate("/admin/dashboard");

      setIsLoggedIn(true);
    } catch (err) {
      console.error("Login error:", err);
      setError("⚠️ Server error. Please try again.");
    }
  };

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <Navbar />
      <div className="login-overlay"></div>
      <div className="login-box">
        <h1 className="login-title">Login</h1>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-group">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="donor">Donor</option>
              <option value="hospital">Hospital</option>
              {/* <option value="admin">Admin</option> */}
            </select>
          </div>
          <div className="login-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="login-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn">
            Login
          </button>
          <p className="login-register">
            Don’t have an account?{" "}
            <span onClick={() => navigate("/register")}>Register here</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
