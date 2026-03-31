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
    <header className="h-[64px] bg-white border-b border-[#e5e7eb] flex items-center justify-between px-6 sticky top-0 z-10 w-full shrink-0">
      
      {/* Left side Breadcrumbs */}
      <div className="flex items-center text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb} className="flex items-center text-[#6b7280]">
            {i > 0 && <span className="mx-2 text-[#d1d5db]">/</span>}
            <span className={i === breadcrumbs.length - 1 ? "text-[#111827] font-semibold" : ""}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Right side Utility Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative flex items-center hidden md:flex">
          <div className="flex items-center border border-[#e5e7eb] rounded-md overflow-hidden h-9">
            <select className="bg-[#f9fafb] text-[#374151] border-none text-xs px-3 focus:ring-0 outline-none border-r border-[#e5e7eb] h-full cursor-pointer">
              <option>All</option>
            </select>
            <div className="flex items-center bg-white px-3 w-64">
              <Search className="h-4 w-4 text-[#9ca3af] mr-2" />
              <input 
                type="text" 
                placeholder="Ctrl + K to search" 
                className="w-full text-xs text-[#374151] placeholder-[#9ca3af] border-none focus:ring-0 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-[#e5e7eb] mx-2 hidden md:block"></div>

        {/* Global Nav */}
        <button className="flex items-center gap-1.5 text-xs font-semibold text-[#111827] hover:text-[#3525cd]">
          <Globe className="h-4 w-4 text-[#3525cd] rounded-full bg-[#eef2ff]" />
          Safehaul 2.0
          <ChevronDown className="h-3 w-3 text-[#6b7280]" />
        </button>

        {/* Create Action */}
        <button className="flex items-center gap-1 bg-white border border-[#e5e7eb] text-[#374151] px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-[#f3f4f6]">
          <Plus className="h-4 w-4 text-[#6b7280]" />
          Create new
        </button>

        {/* Icons */}
        <div className="flex items-center gap-3 ml-2 text-[#6b7280]">
          <button className="flex items-center gap-1.5 text-xs font-medium text-[#10b981] mx-2 hover:bg-[#ecfdf5] px-2 py-1 rounded-md">
            <HelpCircle className="h-4 w-4" />
            Live Support
          </button>
          
          <button className="hover:text-[#111827]"><Sun className="h-5 w-5" /></button>
          <button className="hover:text-[#111827]"><Settings className="h-5 w-5" /></button>
          <button className="hover:text-[#111827]"><Send className="h-5 w-5" /></button>
          <button className="hover:text-[#111827]"><Bell className="h-5 w-5" /></button>
          <button className="hover:text-[#111827] ml-2 h-8 w-8 rounded-full bg-[#f3f4f6] flex items-center justify-center border border-[#e5e7eb]">
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
