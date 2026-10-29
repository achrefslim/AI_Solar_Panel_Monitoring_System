import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/css/SignUp.css";
import { FaPhone, FaEye, FaEyeSlash, FaGoogle, FaEnvelope, FaLock, FaUser } from "react-icons/fa6";

import { auth } from "../firebase/config";
import { 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

const SignUp = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const signUpWithEmail = async () => {
    try {
      const { email, password } = formData;
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/auth/login");
    } catch (err) {
      alert(err.message);
    }
  };
  
  const handleGoogleSignup = async() => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/auth/login");
    } catch (err) {
      alert(err.message);
    }
  };
  
  const handleSubmit = e => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName) return alert("Please enter your full name"); 
    if (!formData.email) return alert("Please enter your email"); 
    if (!formData.password) return alert("Please enter a password"); 
    if (formData.password !== formData.confirmPassword) return alert("Passwords do not match");
    if (!agreeTerms) return alert("Please agree to the terms and conditions");

    signUpWithEmail();
  };

  return (
    <div className="login-main" id="signup">

      <div className="login-background-effects"></div>
      
      <div className="solar-orbit solar-orbit-1"></div>
      <div className="solar-orbit solar-orbit-2"></div>
      <div className="solar-orbit solar-orbit-3"></div>
      
      <div className="solar-core"></div>

      <div className="login-content">
        <div className="login-center-container">
          
          <div className="login-header">
            <div className="solar-logo">
              <div className="logo-core"></div>
              <div className="logo-orbit"></div>
              <div className="logo-particle"></div>
            </div>
            <h1 className="aurora">SOLAR CONTROL</h1>
            <p className="login-tagline">Energy Management System</p>
          </div>
          
          <div className="login-form">
            <h2>Join Our Network</h2>
            <p className="login-subtitle">Create your operator account</p>
            
            <div className="login-method-toggle">
              <button
                type="button"
                className={`toggle-btn active`}
              >
                <FaEnvelope className="toggle-icon" /> Email
              </button>

              <button
                type="button"
                className="toggle-btn"
                disabled
                style={{ opacity: 0.4, cursor: "not-allowed" }}
              >
                <FaPhone className="toggle-icon" /> Phone (disabled)
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="name-fields">
                <div className="input-group">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    className="form-input"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    className="form-input"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="input-group">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="operator@email.com"
                  className="form-input"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="input-group password-group">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create Password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              
              <div className="input-group password-group">
                <FaLock className="input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              
              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span>
                    I agree to the{" "}
                    <a href="#" className="terms-link">Terms & Conditions</a>
                  </span>
                </label>
              </div>
              
              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  <span className="btn-glow"></span>
                  CREATE ACCOUNT
                </button>

                <button
                  type="button"
                  className="btn btn-google"
                  onClick={handleGoogleSignup}
                >
                  <FaGoogle /> Sign Up with Google
                </button>
              </div>
            </form>
          </div>
          
          <p className="signup-link">
            Already have an account?{" "}
            <Link to="/auth/login">Sign In</Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default SignUp;