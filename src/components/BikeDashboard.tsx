// src/components/BikeDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import type { BikeSpecs } from "@/types/bike";
import { SpecRow } from "./SpecRow";

interface BikeDashboardProps {
  bike: BikeSpecs;
  youtubeSearchUrl: string;
  reset: () => void;
}

function SectionTitle({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "20px 0 16px",
      borderBottom: `1px solid ${accent ? "var(--border-accent)" : "var(--border)"}`,
      marginBottom: 2,
    }}>
      <div style={{ width: 3, height: 14, background: accent ? "var(--accent)" : "var(--border-accent)" }} />
      <span style={{
        fontFamily: "'Geist Mono', monospace",
        fontSize: 10, fontWeight: 700,
        letterSpacing: "0.2em", textTransform: "uppercase",
        color: accent ? "var(--accent)" : "var(--text-2)",
      }}>
        {children}
      </span>
    </div>
  );
}

export function BikeDashboard({ bike, youtubeSearchUrl, reset }: BikeDashboardProps) {
  const [imageUrl, setImageUrl] = useState<string>("/placeholder-moto.jpg");
  const [videoId, setVideoId] = useState<string>(bike.youtubeSoundId ?? "");

  // ─── Image Unsplash ───
  useEffect(() => {
    const queries = [
      `${bike.brand} ${bike.model} motorcycle`,
      `${bike.brand} motorcycle parked`,
      `motorcycle parked side view`,
    ];

    const tryQuery = async (index: number) => {
      if (index >= queries.length) return;
      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(queries[index])}&per_page=5&orientation=landscape&order_by=relevant&content_filter=high`,
          { headers: { Authorization: `Client-ID ${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}` } }
        );
        const data = await res.json();
        const results = data?.results;
        if (!results?.length) { tryQuery(index + 1); return; }

        const filtered = results.filter((r: any) =>
          r.tags?.some((t: any) =>
            ["motorcycle", "bike", "motorbike", "moto"].includes(t.title?.toLowerCase())
          )
        );
        const pool = filtered.length ? filtered : results;
        const best = pool.reduce((prev: any, curr: any) => {
          const target = 16 / 9;
          const prevDiff = Math.abs(prev.width / prev.height - target);
          const currDiff = Math.abs(curr.width / curr.height - target);
          return currDiff < prevDiff ? curr : prev;
        });
        setImageUrl(best.urls.regular);
      } catch { tryQuery(index + 1); }
    };

    tryQuery(0);
  }, [bike.brand, bike.model]);

  // ─── Vidéo YouTube ───
  useEffect(() => {
    if (videoId) return; // déjà un ID fourni par l'IA
    fetch("/api/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: bike.brand, model: bike.model, year: bike.year }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.videoId) setVideoId(data.videoId); })
      .catch(() => {});
  }, [bike.brand, bike.model, bike.year, videoId]);

  return (
    <div className="w-full animate-in fade-in duration-300" style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ─── Stripe ─── */}
      <div className="stripe" />

      {/* ─── Hero header ─── */}
      <div style={{
        background: "var(--bg-1)",
        border: "1px solid var(--border)",
        borderTop: "none",
        padding: "32px 32px 28px",
        marginBottom: 2,
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <div>
            <div style={{
              fontFamily: "'Geist Mono', monospace", fontSize: 9,
              letterSpacing: "0.25em", textTransform: "uppercase",
              color: "var(--text-3)", marginBottom: 10,
            }}>
              {bike.brand}
            </div>
            <h2 style={{
              fontFamily: "'Arial Black', sans-serif",
              fontSize: "clamp(40px, 7vw, 80px)",
              fontWeight: 900, color: "var(--text)",
              letterSpacing: "-0.02em", lineHeight: 1, textTransform: "uppercase",
            }}>
              {bike.model}
            </h2>
            <div className="mono" style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.15em", marginTop: 10 }}>
              ANNÉE —&nbsp;<span style={{ color: "var(--accent)" }}>{bike.year}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
            <a
              href={youtubeSearchUrl} target="_blank" rel="noreferrer"
              className="btn-primary"
              style={{ padding: "12px 24px", fontSize: 10, letterSpacing: "0.15em", textDecoration: "none", display: "inline-block" }}
            >
              ▶ SON ÉCHAPPEMENT
            </a>
            <button onClick={reset} className="btn-ghost" style={{ padding: "12px 20px", fontSize: 10 }}>
              ↺ NOUVELLE SÉLECTION
            </button>
          </div>
        </div>
      </div>

      {/* ─── Image + timing overlay ─── */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "21/8", overflow: "hidden", background: "var(--bg-2)", marginBottom: 2 }}>
        <img
          src={imageUrl}
          alt={`${bike.brand} ${bike.model}`}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.7s" }}
          loading="lazy"
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(10,10,10,0.88))",
          padding: "40px 32px 20px",
          display: "flex", gap: 32, alignItems: "flex-end", flexWrap: "wrap",
        }}>
          {[
            { l: "PUISSANCE", v: bike.power },
            { l: "CYLINDRÉE", v: bike.displacement },
            { l: "VITESSE MAX", v: bike.topSpeed },
            { l: "0-100 km/h", v: bike.acceleration0To100 },
            { l: "POIDS",     v: bike.weight },
            { l: "COUPLE",    v: bike.torque },
          ].map(({ l, v }) => v ? (
            <div key={l}>
              <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>{l}</div>
              <div style={{ fontFamily: "'Arial Black', sans-serif", fontSize: "clamp(14px, 1.6vw, 20px)", fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>{v}</div>
            </div>
          ) : null)}
        </div>
      </div>

      {/* ─── SPECS MOTEUR ─── */}
      <SectionTitle>Spécifications moteur</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 2, marginBottom: 24 }}>
        <SpecRow label="Architecture Moteur"   value={bike.engine} />
        <SpecRow label="Cylindrée"             value={bike.displacement} />
        <SpecRow label="Puissance Maxi"        value={bike.power} accent />
        <SpecRow label="Couple Moteur"         value={bike.torque} />
        <SpecRow label="Compression"           value={bike.compression ?? null} />
        <SpecRow label="Alésage × Course"      value={bike.boreStroke ?? null} />
        <SpecRow label="Calage / Firing"       value={bike.firingOrder ?? null} />
        <SpecRow label="Refroidissement"       value={bike.cooling ?? null} />
        <SpecRow label="Embrayage"             value={bike.clutch ?? null} />
      </div>

      {/* ─── TRANSMISSION ─── */}
      <SectionTitle>Performance</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 2, marginBottom: 24 }}>
        <SpecRow label="Vitesse Maxi" value={bike.topSpeed} accent />
        <SpecRow label="0-100 km/h" value={bike.acceleration0To100} accent />
      </div>

      <SectionTitle>Transmission & Châssis</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 2, marginBottom: 24 }}>
        <SpecRow label="Boîte de Vitesses"     value={bike.gearbox} />
        <SpecRow label="Transmission Finale"   value={bike.transmission} />
        <SpecRow label="Cadre"                 value={bike.frame ?? null} />
        <SpecRow label="Suspension Avant"      value={bike.frontSuspension ?? null} />
        <SpecRow label="Suspension Arrière"    value={bike.rearSuspension ?? null} />
        <SpecRow label="Frein Avant"           value={bike.frontBrakes ?? null} />
        <SpecRow label="Frein Arrière"         value={bike.rearBrakes ?? null} />
      </div>

      {/* ─── PNEUMATIQUES & DIMENSIONS ─── */}
      <SectionTitle>Pneumatiques & Dimensions</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 2, marginBottom: 24 }}>
        <SpecRow label="Pneu Avant"            value={bike.frontTire ?? null} />
        <SpecRow label="Pneu Arrière"          value={bike.rearTire ?? null} />
        <SpecRow label="Hauteur de Selle"      value={bike.seatHeight ?? null} accent />
        <SpecRow label="Réservoir"             value={bike.fuelCapacity ?? null} />
        <SpecRow label="Consommation"          value={bike.fuelConsumption ?? null} />
        <SpecRow label="Poids"                 value={bike.weight} />
      </div>

      {/* ─── Analyse & culture ─── */}
      <SectionTitle>Analyse & culture moto</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2, marginBottom: 24 }}>
        {[
          { k: "ANECDOTE EXPERT",        v: bike.anecdote },
          { k: "HISTOIRE & GENÈSE",      v: bike.history },
          { k: "INNOVATIONS EMBARQUÉES", v: bike.innovations },
          { k: "VS ANNÉE PRÉCÉDENTE",    v: bike.vsLastYear },
        ].map(({ k, v }) => (
          <div key={k} style={{ background: "var(--bg-1)", border: "1px solid var(--border)", padding: "24px 24px" }}>
            <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>{k}</div>
            <p className="mono" style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.9, letterSpacing: "0.04em", margin: 0 }}>{v}</p>
          </div>
        ))}
      </div>

      {/* ─── Pannes ─── */}
      <SectionTitle accent>Points faibles & pannes connues</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 2, marginBottom: 40 }}>
        {bike.issues.map((issue, i) => (
          <div key={`${issue}-${i}`} style={{
            background: "var(--bg-1)",
            borderLeft: "3px solid var(--accent)",
            padding: "22px 22px",
          }}>
            <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "var(--accent)", marginBottom: 10 }}>
              DÉFAUT {String(i + 1).padStart(2, "0")}
            </div>
            <p className="mono" style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.8, margin: 0, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {issue}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}