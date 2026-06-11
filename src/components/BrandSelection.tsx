// src/components/BrandSelection.tsx
"use client";

import { useState } from "react";

interface BrandSelectionProps {
  topMakes: string[];
  onSelectBrand: (brand: string) => void;
  onCustomBrandSubmit: (customBrand: string) => void;
}

export function BrandSelection({ topMakes, onSelectBrand, onCustomBrandSubmit }: BrandSelectionProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customBrand, setCustomBrand] = useState("");

  const handleSubmit = () => {
    const trimmed = customBrand.trim();
    if (!trimmed) return;
    onCustomBrandSubmit(trimmed);
    setCustomBrand("");
  };

  return (
    <section className="w-full animate-in fade-in duration-200" style={{ paddingBottom: 32 }}>

      {/* Step header */}
      <div className="flex items-center gap-4 mb-8">
        <span className="stat-value green" style={{ fontSize: 48, lineHeight: 1 }}>01</span>
        <div>
          <div className="label mb-1">Étape 1 / 5</div>
          <h2 className="uppercase" style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: "-0.01em", color: "var(--text)" }}>
            SÉLECTIONNE LA MARQUE
          </h2>
        </div>
      </div>

      {/* Brand grid */}
      <div
        className="grid w-full"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 2 }}
      >
        {topMakes.map((brand) => (
          <button
            key={brand}
            onClick={() => onSelectBrand(brand)}
            className="card group text-left transition-all duration-150"
            style={{ padding: "20px 16px", cursor: "pointer" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border-accent)";
              (e.currentTarget as HTMLElement).style.background = "var(--accent-dim)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLElement).style.background = "var(--bg-1)";
            }}
          >
            <span
              className="block uppercase"
              style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 14, fontWeight: 900, letterSpacing: "0.05em", color: "var(--text)", marginBottom: 8 }}
            >
              {brand}
            </span>
            <span className="label-dim" style={{ color: "var(--text-3)", fontSize: 9 }}>EXPLORER →</span>
          </button>
        ))}

        {!showCustomInput && (
          <button
            onClick={() => setShowCustomInput(true)}
            className="card text-left transition-all duration-150"
            style={{
              padding: "20px 16px",
              borderStyle: "dashed",
              borderColor: "var(--border-accent)",
              cursor: "pointer",
              minHeight: 88,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <span style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 14, fontWeight: 900, color: "var(--accent)", letterSpacing: "0.05em" }}>
              AUTRE +
            </span>
            <span className="label-dim" style={{ fontSize: 9, marginTop: 8 }}>SAISIR MANUELLEMENT</span>
          </button>
        )}
      </div>

      {/* Custom input */}
      {showCustomInput && (
        <div
          className="card-accent animate-in fade-in slide-in-from-top-2"
          style={{ marginTop: 16, padding: "20px 20px", maxWidth: 420 }}
        >
          <div className="label mb-3">MARQUE PERSONNALISÉE</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customBrand}
              onChange={(e) => setCustomBrand(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Ex: Cagiva, Mash, Voge..."
              style={{
                flex: 1,
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                fontFamily: "'Geist Mono', monospace",
                fontSize: 12,
                letterSpacing: "0.05em",
                padding: "10px 14px",
                outline: "none",
                textTransform: "uppercase",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--border-accent)")}
              onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            <button
              onClick={handleSubmit}
              disabled={!customBrand.trim()}
              className="btn-primary px-5"
              style={{ opacity: customBrand.trim() ? 1 : 0.3, fontSize: 11 }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </section>
  );
}