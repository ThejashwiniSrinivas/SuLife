import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <header className="logo-navbar" onClick={() => navigate("/")}>
      <img src={logo} alt="SuLife Logo" />
      <span>SuLife</span>
    </header>
  );
};

export default Navbar;
