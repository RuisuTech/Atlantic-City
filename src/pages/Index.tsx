
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  // Si el usuario ha iniciado sesión, redirigir al dashboard
  // De lo contrario, redirigir a login
  return user && user.isAuthenticated 
    ? <Navigate to="/dashboard" replace /> 
    : <Navigate to="/login" replace />;
};

export default Index;
