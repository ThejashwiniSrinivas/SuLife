import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import landingbg from '../assets/landingbg.jpg';
import './AdminLogin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (email.trim() === 'admin@gmail.com' && password.trim() === 'admin123') {
        // ✅ Store fake token and role in localStorage
        localStorage.setItem('token', 'admin-token');
        localStorage.setItem('role', 'admin');
        navigate('/admin/dashboard');
      } else {
        setError('Invalid email or password.');
      }
      setLoading(false);
    }, 800); // slight delay for UX
  };

  return (
    <>
      <Navbar />
      <div
        className="admin-login-wrapper"
        style={{ backgroundImage: `url(${landingbg})` }}
      >
        <div className="admin-login-content-wrapper">
          <div className="admin-login-container">
            <h2>Admin Login</h2>
            <form onSubmit={submit} className="admin-login-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Enter admin email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Enter admin password"
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                type="submit"
                className="admin-login-btn"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>

          <button className="back-btn" onClick={() => navigate('/register')}>
            ← Back
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
