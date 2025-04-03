
import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "sonner";

interface User {
  username: string;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user credentials
const DEMO_USERNAME = "admin";
const DEMO_PASSWORD = "password";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("casino-user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem("casino-user");
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // In a real application, this would be an API call to validate the credentials
    if (username === DEMO_USERNAME && password === DEMO_PASSWORD) {
      const newUser = { username, isAuthenticated: true };
      setUser(newUser);
      localStorage.setItem("casino-user", JSON.stringify(newUser));
      toast.success("Login successful");
      return true;
    }
    toast.error("Invalid credentials");
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("casino-user");
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
