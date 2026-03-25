"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: "1rem",
        padding: "2rem",
        fontFamily: "var(--font-body), system-ui, sans-serif",
      }}
    >
      <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h2>
      <p style={{ color: "var(--on-surface-variant, #666)", textAlign: "center" }}>
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: "0.625rem 1.25rem",
          borderRadius: "0.5rem",
          border: "none",
          backgroundColor: "var(--primary, #0066ff)",
          color: "#fff",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
