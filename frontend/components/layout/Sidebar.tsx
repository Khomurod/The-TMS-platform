"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Building2, 
  LayoutDashboard, 
  Truck, 
  Map, 
  Users, 
  Settings, 
  Wallet,
  MoreHorizontal
} from "lucide-react";

const mainLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Load Management", href: "/loads", icon: Map },
  { name: "Fleet Management", href: "/fleet", icon: Truck },
  { name: "HR Management", href: "/drivers", icon: Users },
  { name: "Accounting", href: "/accounting", icon: Wallet },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] bg-white border-r border-[#e5e7eb] flex flex-col h-screen overflow-hidden sticky top-0 transition-all duration-300 z-20">
      {/* Brand Header */}
      <div className="h-[64px] flex items-center px-6 border-b border-[#e5e7eb] shrink-0">
        <div className="flex items-center gap-2 text-[#3525cd] font-bold text-xl tracking-tight">
          <Truck className="h-6 w-6 text-[#3525cd]" />
          Safehaul TMS
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {mainLinks.map((link) => {
          const isActive = pathname.startsWith(link.href) || (pathname === "/" && link.href === "/dashboard");
          const Icon = link.icon;
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-[#eef2ff] text-[#3525cd]" 
                  : "text-[#4b5563] hover:bg-[#f3f4f6]"
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-[#3525cd]" : "text-[#9ca3af]"}`} />
              {link.name}
              {link.name === "Load Management" && (
                <span className="ml-auto bg-[#3b82f6] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="shrink-0 p-4 border-t border-[#e5e7eb]">
        <button className="flex items-center w-full gap-2 px-3 py-2 rounded-md hover:bg-[#f3f4f6] transition-colors text-left border border-[#e5e7eb] bg-white mb-4">
          <Building2 className="h-4 w-4 text-[#6b7280]" />
          <span className="text-xs font-medium text-[#374151] truncate w-full">WENZE TRANSPORT SERVICES</span>
        </button>
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#eef2ff] text-[#3525cd] flex items-center justify-center text-xs font-bold ring-2 ring-white">
              TR
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#111827] leading-none mb-1">Tom Robinson</span>
              <span className="text-[10px] text-[#6b7280] leading-none">hr@wenze.com</span>
            </div>
          </div>
          <MoreHorizontal className="h-4 w-4 text-[#9ca3af] cursor-pointer" />
        </div>
      </div>
    </aside>
  );
}
