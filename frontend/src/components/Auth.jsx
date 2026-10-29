import { useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";

import Login from "./Login";
import SignUp from "./Signup";

const Auth = ({ onSignup }) => {
  const user = useMemo(() => {
    return localStorage.getItem("solar_user");
  }, []);
  
  const { type } = useParams();

  if (type === "login" && !user) return <Login />;
  if (type === "signup" && !user) return <SignUp onSignup={onSignup} />;
  
  return <Navigate to={
    user ? "/dashboard" : "/auth/login"
  } replace />;
};

export default Auth;