import { AlertTriangle, CheckCircle2 } from "lucide-react";

type StatusVal = 
  | "ACTIVE" 
  | "AVAILABLE" 
  | "IN TRANSIT" 
  | "DISPATCHED" 
  | "DELIVERED" 
  | "Ready to go" 
  | "Not ready";

interface StatusPillProps {
  status: StatusVal | string;
}

export default function StatusPill({ status }: StatusPillProps) {
  const normStatus = status.toUpperCase();

  // Outline versions with Icons
  if (normStatus === "READY TO GO") {
    return (
      <div className="flex items-center gap-1.5 text-[#10b981] text-xs font-medium">
        <CheckCircle2 className="h-4 w-4" />
        Ready to go
      </div>
    );
  }

  if (normStatus === "NOT READY") {
    return (
      <div className="flex items-center gap-1.5 text-[#f59e0b] text-xs font-medium">
        <AlertTriangle className="h-4 w-4" />
        Not ready
      </div>
    );
  }

  // Solid Pill mapping
  let bg = "bg-gray-500";
  let textColor = "text-white";

  switch (normStatus) {
    case "ACTIVE":
    case "AVAILABLE":
    case "DELIVERED":
      bg = "bg-[#10b981]"; // Green
      break;
    case "IN TRANSIT":
      bg = "bg-[#f97316]"; // Orange
      break;
    case "DISPATCHED":
      bg = "bg-[#3b82f6]"; // Blue
      break;
    default:
      bg = "bg-gray-500";
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${bg} ${textColor}`}>
      {status}
    </span>
  );
}
