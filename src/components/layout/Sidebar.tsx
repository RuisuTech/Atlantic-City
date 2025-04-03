
import React from "react";
import { NavLink } from "react-router-dom";
import { Users, Receipt, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar: React.FC = () => {
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
          <NavItem to="/dashboard" icon={<Home size={20} />} label="Dashboard" />
          <NavItem to="/clients" icon={<Users size={20} />} label="Clients" />
          <NavItem to="/tickets" icon={<Receipt size={20} />} label="Tickets" />
        </ul>
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
