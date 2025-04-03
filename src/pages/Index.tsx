import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  // If user is logged in, redirect to dashboard
  // Otherwise redirect to login
  return user && user.isAuthenticated 
    ? <Navigate to="/dashboard" replace /> 
    : <Navigate to="/login" replace />;
};

export default Index;
