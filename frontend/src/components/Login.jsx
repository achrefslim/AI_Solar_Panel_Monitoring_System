import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/css/Login.css";
import { FaEye, FaEyeSlash, FaGoogle, FaEnvelope, FaLock } from "react-icons/fa6";

import { auth } from "../firebase/config";
import { 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  onAuthStateChanged
} from "firebase/auth";

const Login = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(user);
        return;
        
        if (window.location.pathname !== "/dashboard") {
          navigate("/dashboard", { replace: true });
        }
      }
    });

    return () => unsubscribe();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const storeUserData = (user) => {
    const data = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || null,
      lastLogin: new Date().toISOString()
    };

    localStorage.setItem("solar_user", JSON.stringify(data));
  };
  
  const loginWithEmail = async () => {
    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      const result = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      storeUserData(result.user);
      navigate("/dashboard");

    } catch (err) {
      alert(err.message);
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      storeUserData(result.user);
      navigate("/dashboard");

    } catch (err) {
      alert(err.message);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email) return alert("Please enter your email");
    if (!formData.password) return alert("Please enter your password");

    loginWithEmail();
  };

  return (
    <div className="login-main">

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
            <h2>Welcome !</h2>
            <p className="login-subtitle">Access your energy dashboard</p>

            <form onSubmit={handleSubmit}>
              
              <div className="input-group">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="operator@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="input-group password-group">
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
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

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span>Remember Me</span>
                </label>
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  <span className="btn-glow"></span>
                  ACCESS DASHBOARD
                </button>

                <button
                  type="button"
                  className="btn btn-google"
                  onClick={handleGoogleLogin}
                >
                  <FaGoogle /> Login with Google
                </button>
              </div>
            </form>
          </div>

          <p className="signup-link">
            New operator? <Link to="/auth/signup">Sign Up</Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;