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
    <header 
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-10 w-full shrink-0 border-b"
      style={{ 
        backgroundColor: "var(--surface-lowest)", 
        borderColor: "var(--outline-variant)" 
      }}
    >
      {/* Left: Breadcrumbs */}
      <div className="flex items-center">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb} className="flex items-center">
            {i > 0 && (
              <span className="mx-2 text-xs" style={{ color: "var(--outline-variant)" }}>/</span>
            )}
            <span 
              className="text-[13px]"
              style={{ 
                color: i === breadcrumbs.length - 1 ? "var(--on-surface)" : "var(--on-surface-variant)",
                fontWeight: i === breadcrumbs.length - 1 ? 700 : 500,
              }}
            >
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="hidden md:flex items-center">
          <div 
            className="flex items-center rounded-lg overflow-hidden h-8 transition-all"
            style={{ 
              backgroundColor: "var(--surface-container-high)", 
              border: "1px solid var(--outline-variant)" 
            }}
          >
            <select 
              className="bg-transparent border-none text-[11px] px-2 outline-none h-full cursor-pointer font-medium"
              style={{ color: "var(--on-surface-variant)", borderRight: "1px solid var(--outline-variant)" }}
            >
              <option>All</option>
            </select>
            <div className="flex items-center px-2.5 w-52">
              <Search className="h-3.5 w-3.5 mr-2 shrink-0" style={{ color: "var(--on-surface-variant)" }} />
              <input 
                type="text" 
                placeholder="Ctrl + K to search" 
                className="w-full bg-transparent border-none outline-none text-[12px]"
                style={{ color: "var(--on-surface)" }}
              />
            </div>
          </div>
        </div>

        <div className="w-px h-5 hidden md:block" style={{ backgroundColor: "var(--outline-variant)" }} />

        {/* Version Badge */}
        <button className="flex items-center gap-1.5 text-[12px] font-bold transition-colors"
          style={{ color: "var(--on-surface)" }}
        >
          <span 
            className="h-5 w-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--primary-fixed)" }}
          >
            <Globe className="h-3 w-3" style={{ color: "var(--primary)" }} />
          </span>
          Safehaul 2.0
          <ChevronDown className="h-3 w-3 opacity-40" />
        </button>

        {/* Create Button */}
        <button 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors"
          style={{ 
            backgroundColor: "var(--surface-lowest)", 
            border: "1px solid var(--outline-variant)",
            color: "var(--on-surface)",
          }}
        >
          <Plus className="h-3.5 w-3.5 opacity-50" />
          Create new
        </button>

        {/* Utility Icons */}
        <div className="flex items-center gap-1.5 ml-1" style={{ color: "var(--on-surface-variant)" }}>
          <button 
            className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-md transition-colors"
            style={{ color: "var(--success)" }}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Support
          </button>
          
          <button className="p-1.5 rounded-md hover:opacity-80 transition-opacity"><Sun className="h-4 w-4" /></button>
          <button className="p-1.5 rounded-md hover:opacity-80 transition-opacity"><Settings className="h-4 w-4" /></button>
          <button className="p-1.5 rounded-md hover:opacity-80 transition-opacity"><Send className="h-4 w-4" /></button>
          <button className="p-1.5 rounded-md hover:opacity-80 transition-opacity relative">
            <Bell className="h-4 w-4" />
            <span 
              className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "var(--error)" }}
            />
          </button>
          <button 
            className="ml-1 h-7 w-7 rounded-full flex items-center justify-center transition-colors"
            style={{ 
              backgroundColor: "var(--surface-container-highest)", 
              color: "var(--on-surface)",
              border: "1px solid var(--outline-variant)" 
            }}
          >
            <User className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
