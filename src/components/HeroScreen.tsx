// src/components/HeroScreen.tsx
"use client";

interface HeroScreenProps {
  onStart: () => void;
}

export function HeroScreen({ onStart }: HeroScreenProps) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Lueur verte haut-gauche */}
      <div style={{
        position: "absolute", top: -120, left: -80,
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(110,255,71,0.08) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Numéro décoratif géant en fond */}
      <div style={{
        position: "absolute", bottom: -40, right: -20,
        fontFamily: "'Arial Black', sans-serif",
        fontSize: "clamp(180px, 30vw, 360px)",
        fontWeight: 900,
        color: "rgba(110,255,71,0.04)",
        lineHeight: 1,
        userSelect: "none",
        pointerEvents: "none",
        zIndex: 0,
        letterSpacing: "-0.05em",
      }}>
        RS
      </div>

      {/* Accent top stripe */}
      <div className="stripe" style={{ position: "relative", zIndex: 1 }} />

      {/* Main — centré verticalement dans l'espace restant */}
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 clamp(24px, 5vw, 80px)",
        maxWidth: 1100,
        width: "100%",
        margin: "0 auto",
        position: "relative",
        zIndex: 1,
        gap: 0,
      }}>

        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 28, height: 2, background: "var(--accent)" }} />
          <span className="label" style={{ fontSize: 9 }}>ENCYCLOPÉDIE MOTO</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Arial Black', sans-serif",
          fontSize: "clamp(56px, 11vw, 130px)",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 0.92,
          color: "var(--text)",
          textTransform: "uppercase",
          marginBottom: 32,
        }}>
          RED<span style={{ color: "var(--accent)" }}>LINE</span>
          <br />SPECS
        </h1>

        {/* Sous-titre */}
        <p className="mono" style={{
          fontSize: 12,
          color: "var(--text-2)",
          maxWidth: 480,
          lineHeight: 1.9,
          letterSpacing: "0.06em",
          marginBottom: 40,
        }}>
          FILTRE PAR PERMIS, CARROSSERIE ET ANNÉE.<br />
          FICHES TECHNIQUES COMPLÈTES. PANNES CONNUES.<br />
          SOUND CHECK ÉCHAPPEMENT.
        </p>

        {/* CTA row */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", marginBottom: 48 }}>
          <button
            onClick={onStart}
            className="btn-primary"
            style={{ padding: "16px 40px", fontSize: 12, letterSpacing: "0.2em" }}
          >
            LANCER LE CONFIGURATEUR →
          </button>
          <span className="mono" style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.15em" }}>
            15 MARQUES · TOUTES CATÉGORIES
          </span>
        </div>

        {/* Stats band */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          maxWidth: 440,
          gap: 0,
          border: "1px solid var(--border)",
        }}>
          {[
            { v: "15+",  l: "Marques",    sub: "MONDIALES" },
            { v: "AI",   l: "Génération", sub: "GROQ POWERED" },
            { v: "360°", l: "Analyse",    sub: "TECHNIQUE" },
          ].map(({ v, l, sub }, i) => (
            <div key={l} style={{
              padding: "18px 16px",
              borderRight: i < 2 ? "1px solid var(--border)" : "none",
              background: "var(--bg-1)",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              <span style={{
                fontFamily: "'Arial Black', sans-serif",
                fontSize: 26, fontWeight: 900,
                color: "var(--accent)", lineHeight: 1,
              }}>{v}</span>
              <span className="mono" style={{ fontSize: 9, color: "var(--text-2)", letterSpacing: "0.15em" }}>{l}</span>
              <span className="mono" style={{ fontSize: 8, color: "var(--text-3)", letterSpacing: "0.12em" }}>{sub}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 44,
        borderTop: "1px solid var(--border)",
        position: "relative", zIndex: 1,
      }}>
        <span className="mono" style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.1em" }}>
          PROJET BUT MMI — NEXT.JS & GROQ AI
        </span>
        {/* Petits carrés déco */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{
              width: i === 1 ? 8 : 4,
              height: 4,
              background: i === 1 ? "var(--accent)" : "var(--bg-3)",
            }} />
          ))}
        </div>
      </footer>
    </div>
  );
}