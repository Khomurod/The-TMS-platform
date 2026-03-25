"use client";

/**
 * Settings Page — Company Profile & User Management
 */

import { useState, useEffect, useCallback } from "react";
import { Settings, Building2, Users, Shield } from "lucide-react";
import api from "@/lib/api";

interface CompanyProfile {
  id: string;
  name: string;
  dot_number?: string;
  mc_number?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
}

interface UserItem {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<"company" | "users">("company");
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (tab === "company") {
          const res = await api.get("/settings/company");
          setCompany(res.data);
        } else {
          const res = await api.get("/settings/users");
          setUsers(res.data.items || []);
        }
      } catch (err) {
        console.error("Settings fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tab]);

  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--surface-low)",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--outline-variant)",
    padding: "var(--spacing-6)",
  };

  const fieldStyle: React.CSSProperties = {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "var(--spacing-4) 0", borderBottom: "1px solid var(--outline-variant)",
  };

  const ROLE_BADGE: Record<string, { bg: string; color: string }> = {
    company_admin: { bg: "rgba(99, 102, 241, 0.15)", color: "#6366f1" },
    dispatcher: { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" },
    accountant: { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" },
    viewer: { bg: "rgba(100, 116, 139, 0.15)", color: "#94a3b8" },
  };

  return (
    <div>
      <div style={{ marginBottom: "var(--spacing-6)" }}>
        <p className="label-sm" style={{ color: "var(--on-surface-variant)", marginBottom: 4 }}>Dashboard &gt; Settings</p>
        <h1 className="headline-md" style={{ color: "var(--on-surface)", margin: 0 }}>Company Settings</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "var(--spacing-3)", marginBottom: "var(--spacing-6)" }}>
        <button
          onClick={() => setTab("company")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "var(--spacing-3) var(--spacing-6)",
            borderRadius: "var(--radius-lg)",
            border: tab === "company" ? "1px solid var(--primary)" : "1px solid var(--outline-variant)",
            backgroundColor: tab === "company" ? "var(--primary)" : "transparent",
            color: tab === "company" ? "var(--on-primary)" : "var(--on-surface)",
            cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
          }}
        >
          <Building2 size={16} /> Company Profile
        </button>
        <button
          onClick={() => setTab("users")}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "var(--spacing-3) var(--spacing-6)",
            borderRadius: "var(--radius-lg)",
            border: tab === "users" ? "1px solid var(--primary)" : "1px solid var(--outline-variant)",
            backgroundColor: tab === "users" ? "var(--primary)" : "transparent",
            color: tab === "users" ? "var(--on-primary)" : "var(--on-surface)",
            cursor: "pointer", fontSize: "0.875rem", fontWeight: 600,
          }}
        >
          <Users size={16} /> Users & Permissions
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--on-surface-variant)", padding: "var(--spacing-8)" }}>Loading...</p>
      ) : tab === "company" ? (
        <div style={cardStyle}>
          <h3 className="title-md" style={{ color: "var(--on-surface)", marginBottom: "var(--spacing-4)" }}>Company Information</h3>
          {company ? (
            <>
              <div style={fieldStyle}>
                <span style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>Company Name</span>
                <span style={{ color: "var(--on-surface)", fontWeight: 600 }}>{company.name}</span>
              </div>
              <div style={fieldStyle}>
                <span style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>DOT Number</span>
                <span style={{ color: "var(--on-surface)", fontWeight: 600 }}>{company.dot_number || "—"}</span>
              </div>
              <div style={fieldStyle}>
                <span style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>MC Number</span>
                <span style={{ color: "var(--on-surface)", fontWeight: 600 }}>{company.mc_number || "—"}</span>
              </div>
              <div style={fieldStyle}>
                <span style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>Address</span>
                <span style={{ color: "var(--on-surface)" }}>{[company.address, company.city, company.state, company.zip_code].filter(Boolean).join(", ") || "—"}</span>
              </div>
              <div style={fieldStyle}>
                <span style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>Phone</span>
                <span style={{ color: "var(--on-surface)" }}>{company.phone || "—"}</span>
              </div>
              <div style={{ ...fieldStyle, borderBottom: "none" }}>
                <span style={{ color: "var(--on-surface-variant)", fontSize: "0.85rem" }}>Email</span>
                <span style={{ color: "var(--on-surface)" }}>{company.email || "—"}</span>
              </div>
            </>
          ) : (
            <p style={{ color: "var(--on-surface-variant)" }}>No company data found</p>
          )}
        </div>
      ) : (
        <div style={cardStyle}>
          <h3 className="title-md" style={{ color: "var(--on-surface)", marginBottom: "var(--spacing-4)" }}>Team Members</h3>
          {users.length === 0 ? (
            <p style={{ color: "var(--on-surface-variant)", textAlign: "center", padding: "var(--spacing-6)" }}>No users found</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                  {["Name", "Email", "Role", "Status"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "var(--spacing-3)", color: "var(--on-surface-variant)", fontWeight: 500, fontSize: "0.75rem", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleBadge = ROLE_BADGE[u.role] || ROLE_BADGE.viewer;
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--outline-variant)" }}>
                      <td style={{ padding: "var(--spacing-3)", color: "var(--on-surface)", fontWeight: 600 }}>{u.first_name} {u.last_name}</td>
                      <td style={{ padding: "var(--spacing-3)", color: "var(--on-surface-variant)" }}>{u.email}</td>
                      <td style={{ padding: "var(--spacing-3)" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", backgroundColor: roleBadge.bg, color: roleBadge.color, fontSize: "0.7rem", fontWeight: 600, textTransform: "capitalize" }}>
                          {u.role?.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ padding: "var(--spacing-3)" }}>
                        <span style={{ color: u.is_active ? "#22c55e" : "#ef4444", fontSize: "0.8rem", fontWeight: 500 }}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
