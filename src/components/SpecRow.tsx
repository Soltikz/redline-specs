// src/components/SpecRow.tsx
"use client";

function isUsefulValue(value?: string | null) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== "" && normalized !== "n/a";
}

export function SpecRow({
  label,
  value,
  accent = false,
  icon,
}: {
  label: string;
  value?: string | null;
  accent?: boolean;
  icon?: string;
}) {
  if (!isUsefulValue(value)) return null;

  return (
    <div
      style={{
        background: accent ? "var(--accent-dim)" : "var(--bg-1)",
        border: `1px solid ${accent ? "var(--border-accent)" : "var(--border)"}`,
        padding: "20px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        transition: "border-color 0.15s",
        cursor: "default",
      }}
      onMouseEnter={e => { if (!accent) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-accent)"; }}
      onMouseLeave={e => { if (!accent) (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <span style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--text-3)",
        }}>{label}</span>
      </div>
      <span style={{
        fontFamily: "'Arial Black', sans-serif",
        fontSize: 15,
        fontWeight: 900,
        color: accent ? "var(--accent)" : "var(--text)",
        letterSpacing: "0.02em",
        lineHeight: 1.2,
        wordBreak: "break-word",
      }}>
        {value!.charAt(0).toUpperCase() + value!.slice(1)}
      </span>
    </div>
  );
}