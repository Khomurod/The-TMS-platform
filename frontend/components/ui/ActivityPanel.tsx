"use client";

import React, { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { MessageCircle, Send, Clock } from "lucide-react";

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
      } catch { setActivities([]); }
      finally { setLoading(false); }
    }
    fetchActivities();
  }, [entityType, entityId]);

  const handleSubmitNote = async () => {
    if (!note.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.post(`/${entityType}s/${entityId}/notes`, { message: note.trim() });
      setNote("");
      const res = await api.get(`/${entityType}s/${entityId}/activity`);
      setActivities(res.data.items || []);
    } catch { console.error("Failed to post note"); }
    finally { setSubmitting(false); }
  };

  const fmtTime = (d: string) => {
    const date = new Date(d);
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="card activity-panel flex flex-col" style={{ maxHeight: 400 }}>
      <div className="activity-header">
        <MessageCircle className="h-4 w-4 activity-header-icon" />
        <span className="activity-header-title">Activity</span>
        <span className="activity-badge">{activities.length}</span>
      </div>

      <div ref={scrollRef} className="activity-feed flex-1 space-y-0 min-h-0">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <div className="skeleton h-3 w-3/4" />
                <div className="skeleton h-2 w-1/3" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-2" style={{ color: "var(--outline-variant)" }} />
            <p className="body-sm" style={{ color: "var(--on-surface-variant)" }}>No activity yet</p>
          </div>
        ) : (
          activities.map((item) => (
            <div key={item.id} className="activity-item">
              <div className={`activity-dot activity-dot--${item.type}`} />
              <div className="activity-content">
                <p className="activity-message">{item.message}</p>
                <div className="activity-meta">
                  {item.user_name && <span className="activity-user">{item.user_name}</span>}
                  <span className="activity-time">
                    <Clock className="h-2.5 w-2.5" />
                    {fmtTime(item.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="activity-note-input-wrap">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmitNote()}
          placeholder="Add a note..."
          className="activity-note-input"
        />
        <button
          onClick={handleSubmitNote}
          disabled={!note.trim() || submitting}
          className="activity-send-btn"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
