"use client";

import React, { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { MessageCircle, Send, Clock } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   ActivityPanel — Load/entity activity feed + notes sidebar
   Blueprint: Phase 5.1 — Right sidebar component
   ═══════════════════════════════════════════════════════════════ */

interface ActivityItem {
  id: string;
  type: "status_change" | "note" | "assignment" | "system";
  message: string;
  user_name?: string;
  created_at: string;
}

interface ActivityPanelProps {
  entityType: "load" | "driver" | "truck";
  entityId: string;
}

export default function ActivityPanel({ entityType, entityId }: ActivityPanelProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      try {
        const res = await api.get(`/${entityType}s/${entityId}/activity`);
        setActivities(res.data.items || []);
      } catch {
        // Activity feed is non-critical — silent fail
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, [entityType, entityId]);

  const handleSubmitNote = async () => {
    if (!note.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.post(`/${entityType}s/${entityId}/notes`, { message: note.trim() });
      setNote("");
      // Re-fetch
      const res = await api.get(`/${entityType}s/${entityId}/activity`);
      setActividades(res.data.items || []);
    } catch {
      console.error("Failed to post note");
    } finally {
      setSubmitting(false);
    }
  };

  const setActividades = setActivities; // alias for re-fetch

  const fmtTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const typeColors: Record<string, string> = {
    status_change: "var(--primary)",
    note: "var(--status-booked)",
    assignment: "var(--status-assigned)",
    system: "var(--on-surface-variant)",
  };

  return (
    <div
      className="card flex flex-col"
      style={{
        backgroundColor: "var(--surface-lowest)",
        maxHeight: 400,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--outline-variant)" }}
      >
        <MessageCircle className="h-4 w-4" style={{ color: "var(--primary)" }} />
        <span className="title-sm" style={{ color: "var(--on-surface)" }}>
          Activity
        </span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto tabular-nums"
          style={{
            backgroundColor: "var(--surface-container-high)",
            color: "var(--on-surface-variant)",
          }}
        >
          {activities.length}
        </span>
      </div>

      {/* Activity Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <div className="h-3 w-3/4 rounded animate-pulse" style={{ backgroundColor: "var(--surface-container)" }} />
                <div className="h-2 w-1/3 rounded animate-pulse" style={{ backgroundColor: "var(--surface-container-high)" }} />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--outline-variant)" }} />
            <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              No activity yet
            </p>
          </div>
        ) : (
          activities.map((item) => (
            <div key={item.id} className="flex gap-2.5">
              {/* Timeline dot */}
              <div className="flex flex-col items-center shrink-0 mt-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: typeColors[item.type] || "var(--outline)" }}
                />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed" style={{ color: "var(--on-surface)" }}>
                  {item.message}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.user_name && (
                    <span className="text-[10px] font-medium" style={{ color: "var(--primary)" }}>
                      {item.user_name}
                    </span>
                  )}
                  <span className="text-[10px] flex items-center gap-0.5" style={{ color: "var(--on-surface-variant)" }}>
                    <Clock className="h-2.5 w-2.5" />
                    {fmtTime(item.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Note Input */}
      <div
        className="shrink-0 px-3 py-2.5 flex items-center gap-2"
        style={{ borderTop: "1px solid var(--outline-variant)" }}
      >
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmitNote()}
          placeholder="Add a note..."
          className="flex-1 text-xs bg-transparent outline-none"
          style={{ color: "var(--on-surface)" }}
        />
        <button
          onClick={handleSubmitNote}
          disabled={!note.trim() || submitting}
          className="p-1.5 rounded transition-colors disabled:opacity-30"
          style={{ color: "var(--primary)" }}
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
