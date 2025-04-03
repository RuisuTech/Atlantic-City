
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut, User } from "lucide-react";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-card border-b border-border p-4 flex justify-between items-center">
      <div>
        <h2 className="text-lg font-medium">Bienvenido, {user?.username}</h2>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={logout}
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
};

export default Header;
