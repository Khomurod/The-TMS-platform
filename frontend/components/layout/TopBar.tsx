"use client";

import { usePathname } from "next/navigation";
import { 
  Search, 
  HelpCircle, 
  Sun, 
  Settings, 
  Send, 
  Bell, 
  User, 
  Plus,
  ChevronDown,
  Globe
} from "lucide-react";

export default function TopBar() {
  const pathname = usePathname();

  // Basic breadcrumb generation for visual demo
  const getBreadcrumbs = () => {
    if (pathname.includes("drivers")) return ["HR management", "Drivers", "Active drivers"];
    if (pathname.includes("loads")) return ["Load management", "All Loads"];
    if (pathname.includes("fleet")) return ["Fleet management", "Trucks"];
    if (pathname.includes("dashboard")) return ["Dashboard", "Get things done"];
    if (pathname.includes("accounting")) return ["Accounting", "Financials"];
    return ["Home"];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-[64px] bg-[var(--surface-lowest)] border-b border-[var(--outline-variant)] flex items-center justify-between px-6 sticky top-0 z-10 w-full shrink-0">
      
      {/* Left side Breadcrumbs */}
      <div className="flex items-center text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb} className="flex items-center text-[var(--on-surface-variant)]">
            {i > 0 && <span className="mx-2 text-[var(--outline-variant)]">/</span>}
            <span className={i === breadcrumbs.length - 1 ? "text-[var(--on-surface)] font-bold label-md" : "label-md"}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Right side Utility Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <div className="flex items-center bg-[var(--surface-container-high)] ghost-border rounded-[var(--radius-md)] overflow-hidden h-8 transition-colors focus-within:bg-[var(--surface-lowest)] focus-within:border-[var(--primary)]">
            <select className="bg-transparent text-[var(--on-surface-variant)] border-none text-xs px-2 focus:ring-0 outline-none border-r ghost-border h-full cursor-pointer label-sm font-medium">
              <option>All</option>
            </select>
            <div className="flex items-center px-2 w-56">
              <Search className="h-3.5 w-3.5 text-[var(--on-surface-variant)] mr-2" />
              <input 
                type="text" 
                placeholder="Ctrl + K to search" 
                className="w-full bg-transparent text-[var(--on-surface)] placeholder-[var(--on-surface-variant)] border-none focus:ring-0 outline-none label-sm"
              />
            </div>
          </div>
        </div>

        <div className="w-px h-5 bg-[var(--outline-variant)] mx-1 hidden md:block"></div>

        {/* Global Nav */}
        <button className="flex items-center gap-1.5 label-md font-bold text-[var(--on-surface)] hover:text-[var(--primary)] transition-colors">
          <Globe className="h-4 w-4 text-[var(--primary)] rounded-full bg-[var(--primary-fixed)]" />
          Safehaul 2.0
          <ChevronDown className="h-3 w-3 text-[var(--on-surface-variant)]" />
        </button>

        {/* Create Action */}
        <button className="flex items-center gap-1 bg-[var(--surface-lowest)] border border-[var(--outline-variant)] text-[var(--on-surface)] px-2.5 py-1 rounded-[var(--radius-md)] label-sm font-bold shadow-ambient hover:bg-[var(--surface-container)] transition-colors">
          <Plus className="h-3.5 w-3.5 text-[var(--on-surface-variant)]" />
          Create new
        </button>

        {/* Icons */}
        <div className="flex items-center gap-2.5 ml-1 text-[var(--on-surface-variant)]">
          <button className="flex items-center gap-1 label-sm font-bold text-[var(--success)] mx-1 hover:bg-[var(--success-container)] px-2 py-1 rounded-[var(--radius-md)] transition-colors">
            <HelpCircle className="h-3.5 w-3.5" />
            Support
          </button>
          
          <button className="hover:text-[var(--on-surface)] transition-colors"><Sun className="h-4 w-4" /></button>
          <button className="hover:text-[var(--on-surface)] transition-colors"><Settings className="h-4 w-4" /></button>
          <button className="hover:text-[var(--on-surface)] transition-colors"><Send className="h-4 w-4" /></button>
          <button className="hover:text-[var(--on-surface)] transition-colors relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-0 right-0 h-1.5 w-1.5 bg-[var(--error)] rounded-full"></span>
          </button>
          <button className="ml-1 h-7 w-7 rounded-full bg-[var(--surface-container-highest)] flex items-center justify-center ghost-border hover:bg-[var(--surface-variant)] transition-colors text-[var(--on-surface)]">
            <User className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
