"use client";
import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: 40, textAlign: "center", maxWidth: 500, margin: "60px auto",
          background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #ef4444, #f97316)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
          }}>⚠️</div>
          <h3 style={{ color: "#1e293b", fontWeight: 700, fontSize: 18, margin: "0 0 8px" }}>
            Something went wrong
          </h3>
          <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 20px", lineHeight: 1.5 }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: "10px 24px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff",
              fontWeight: 600, fontSize: 13, transition: "opacity 0.2s",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
