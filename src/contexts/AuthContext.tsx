
import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "sonner";
import { supabase, UserRole, AppUser } from "@/integrations/supabase/client";

interface User {
  id: string;
  username: string;
  role: UserRole;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    try {
      // Fetch the user from our app_users table
      const { data, error } = await supabase
        .from('app_users')
        .select('id, username, role, password_hash, active')
        .eq('username', username)
        .single();

      if (error || !data) {
        toast.error("Usuario no encontrado");
        return false;
      }

      if (!data.active) {
        toast.error("Esta cuenta está desactivada");
        return false;
      }

      // For demo purposes, we're comparing passwords directly
      // In a real app, you'd use bcrypt.compare or similar
      // Here we're just checking if the stored hash equals our demo passwords
      const isAdmin = data.password_hash === '$2a$10$x5BFDVo7UMKtecqY9RYCCOlQgRTlKJGqO6BF7hGgXUUdR8v4iSaaa' && password === 'admin123';
      const isCashier = data.password_hash === '$2a$10$uXBhH.eQHhQKAUfGVRXKJeXAY6vUIVVBQ0SWvPj5tTzkKyXU0yWoy' && password === 'cashier123';
      
      if (!isAdmin && !isCashier) {
        toast.error("Credenciales incorrectas");
        return false;
      }

      const newUser = { 
        id: data.id,
        username: data.username, 
        role: data.role as UserRole,
        isAuthenticated: true 
      };
      
      setUser(newUser);
      localStorage.setItem("casino-user", JSON.stringify(newUser));
      toast.success("Inicio de sesión exitoso");
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Error al iniciar sesión");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("casino-user");
    toast.success("Sesión cerrada correctamente");
  };

  // Define a permission system based on roles
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Define permissions for each role
    const rolePermissions: Record<UserRole, string[]> = {
      admin: [
        "manage_users",
        "manage_clients", 
        "view_all_clients",
        "manage_tickets", 
        "export_all_tickets",
        "change_membership",
        "view_reports",
        "configure_settings"
      ],
      cashier: [
        "view_active_clients",
        "create_tickets",
        "view_client_tickets",
        "export_today_tickets"
      ]
    };

    return rolePermissions[user.role]?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
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

export type { UserRole };
