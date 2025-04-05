
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { 
  Moon, Sun, LogOut, User, 
  ShieldCheck, BadgeHelp 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getRoleIcon = () => {
    switch (user?.role) {
      case "admin":
        return <ShieldCheck className="h-4 w-4 text-primary" />;
      case "cashier":
        return <BadgeHelp className="h-4 w-4 text-primary" />;
      default:
        return <User className="h-4 w-4 text-primary" />;
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case "admin":
        return "Administrador";
      case "cashier":
        return "Cajero";
      default:
        return "Usuario";
    }
  };

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-card border-b border-border p-4 flex justify-between items-center">
      <div>
        <h2 className="text-lg font-medium flex items-center gap-1.5">
          Bienvenido, 
          <span className="flex items-center gap-1 text-primary">
            {user?.username}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {getRoleIcon()}
              <span className="ml-1">{getRoleLabel()}</span>
            </span>
          </span>
        </h2>
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user ? getInitials(user.username) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{user?.username}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2">
              {getRoleIcon()}
              <span>{getRoleLabel()}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="flex items-center gap-2 text-destructive focus:text-destructive"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
