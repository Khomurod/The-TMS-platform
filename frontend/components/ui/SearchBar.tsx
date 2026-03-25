import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function SearchBar({
  placeholder = "Search...",
  value,
  onChange,
}: SearchBarProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-3)",
        backgroundColor: "var(--surface-container-high)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--spacing-2) var(--spacing-4)",
        width: "100%",
        transition: "background-color 0.15s ease",
      }}
      className="ghost-border"
    >
      <Search size={16} style={{ color: "var(--on-surface-variant)", flexShrink: 0 }} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          color: "var(--on-surface)",
          fontSize: "0.875rem",
          fontFamily: "var(--font-body)",
          width: "100%",
        }}
      />
    </div>
  );
}
