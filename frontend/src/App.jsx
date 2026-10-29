import { useState } from "react";

import "./styles/css/index.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import ElectricBg from "./components/ElectricBg";

export default function App() {
    const [user, setUser] = useState(null);
    
    const handleSignup = (userData) => {
      setUser(userData);
    };
  
    return (
      <>
        <ElectricBg />

        <Router>
          <Routes>
            <Route 
              path="/auth/:type" 
              element={<Auth onSignup={handleSignup} />}
            />

            <Route 
              path="/dashboard" 
              element={<Dashboard />}
            />
            
            <Route path="/" element={<Navigate to="/auth/login" />} />
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          </Routes>
        </Router>
      </>
    );
}