
import React from "react";
import { NavLink } from "react-router-dom";
import { Users, Receipt, Home, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const Sidebar: React.FC = () => {
  const { user, hasPermission } = useAuth();

  return (
    <aside className="w-full md:w-64 bg-card border-r border-border md:h-screen shrink-0">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
          <span className="text-secondary">♦</span>
          Atlantic City
        </h1>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          <NavItem to="/dashboard" icon={<Home size={20} />} label="Inicio" />
          
          {(hasPermission('view_all_clients') || hasPermission('view_active_clients')) && (
            <NavItem to="/clients" icon={<Users size={20} />} label="Clientes" />
          )}
          
          {(hasPermission('manage_tickets') || hasPermission('create_tickets') || hasPermission('view_client_tickets')) && (
            <NavItem to="/tickets" icon={<Receipt size={20} />} label="Boletas" />
          )}
          
          {user?.role === 'admin' && (
            <NavItem to="/settings" icon={<Settings size={20} />} label="Configuración" />
          )}
          
          {user?.role === 'admin' && (
            <NavItem to="/users" icon={<Shield size={20} />} label="Usuarios" />
          )}
        </ul>
        
        <div className="mt-6 pt-6 border-t border-border">
          <div className="px-3 py-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Rol de Usuario
            </div>
            <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-md bg-primary/5">
              {user?.role === 'admin' ? (
                <Shield size={16} className="text-primary" />
              ) : (
                <Users size={16} className="text-primary" />
              )}
              <span className="text-sm font-medium">
                {user?.role === 'admin' ? 'Administrador' : 'Cajero'}
              </span>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent transition-colors",
            isActive
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "text-foreground"
          )
        }
      >
        {icon}
        <span>{label}</span>
      </NavLink>
    </li>
  );
};

export default Sidebar;
