// src/components/ConfiguratorSteps.tsx
"use client";
import type { PowerCategory, PowerCategoryOption } from "@/types/bike";

interface ConfiguratorStepsProps {
  step: number;
  setStep: (step: number) => void;
  selectedBrand: string;
  selectedPower: string;
  setSelectedPower: (power: PowerCategory) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  bikeTypes: { id: string; label: string; desc: string }[];
  typeLabel: string;
  powerLabel: string;
  powerCategories: PowerCategoryOption[];
  fetchModels: (brand: string, cat: PowerCategory, type: string) => void;
  loadingModels: boolean;
  modelsError: string;
  models: string[];
  fetchModelYears: (brand: string, model: string) => void;
  loadingYears: boolean;
  yearsError: string;
  availableYears: string[];
  selectedModel: string;
  fetchBikeSpecs: (brand: string, model: string, year: string) => void;
}

/* ─── Shared helpers ─── */
function StepHeader({ num, total, title, crumbs }: { num: number; total: number; title: string; crumbs?: string }) {
  return (
    <div className="flex items-center gap-5 mb-8">
      <span
        style={{
          fontFamily: "'Arial Black', sans-serif",
          fontSize: 52,
          fontWeight: 900,
          color: "var(--accent)",
          lineHeight: 1,
          minWidth: 60,
        }}
      >
        0{num}
      </span>
      <div>
        <div className="label mb-1" style={{ color: "var(--text-3)" }}>ÉTAPE {num} / {total}</div>
        <h2 className="uppercase" style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.01em" }}>
          {title}
        </h2>
        {crumbs && (
          <p className="mono" style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4, letterSpacing: "0.1em" }}>
            {crumbs}
          </p>
        )}
      </div>
    </div>
  );
}

function Loader({ label }: { label: string }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-4 w-full" style={{ padding: "64px 0" }}>
      <div
        style={{
          width: 32,
          height: 32,
          border: "2px solid var(--bg-3)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span className="label" style={{ color: "var(--text-3)" }}>{label}</span>
    </div>
  );
}

function ErrorBox({ msg, onBack }: { msg: string; onBack: () => void }) {
  return (
    <div className="card-accent w-full" style={{ padding: 24, borderColor: "rgba(255,80,80,0.4)" }}>
      <span className="mono" style={{ fontSize: 12, color: "#ff6666" }}>{msg}</span>
      <button className="btn-ghost mt-4 px-5 py-3" onClick={onBack}>← RETOUR</button>
    </div>
  );
}

export function ConfiguratorSteps({
  step, setStep,
  selectedBrand, selectedPower, setSelectedPower,
  selectedType, setSelectedType,
  bikeTypes, typeLabel, powerLabel, powerCategories,
  fetchModels, loadingModels, modelsError, models,
  fetchModelYears, loadingYears, yearsError, availableYears,
  selectedModel, fetchBikeSpecs,
}: ConfiguratorStepsProps) {

  /* ─── ÉTAPE 2 ─── */
  if (step === 2) {
    return (
      <section className="w-full animate-in fade-in duration-300">
        <StepHeader num={2} total={5} title="CATÉGORIE DE PUISSANCE" crumbs={`MARQUE — ${selectedBrand}`} />
        <div className="flex flex-col gap-px w-full" style={{ border: "1px solid var(--border)" }}>
          {powerCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedPower(cat.id as PowerCategory); setStep(3); }}
              className="w-full text-left transition-all duration-150"
              style={{ background: "var(--bg-1)", padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, cursor: "pointer" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent-dim)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-1)"; }}
            >
              <div>
                <div className="uppercase" style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 16, fontWeight: 900, color: "var(--text)", letterSpacing: "0.02em" }}>
                  {cat.label}
                </div>
                <div className="mono" style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4, letterSpacing: "0.1em" }}>
                  {cat.desc}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span
                  className="mono"
                  style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.1em", padding: "6px 12px", border: "1px solid var(--border-accent)", background: "var(--accent-dim)" }}
                >
                  {cat.powerRange}
                </span>
                <span style={{ color: "var(--text-3)", fontSize: 18 }}>→</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  /* ─── ÉTAPE 3 ─── */
  if (step === 3) {
    return (
      <section className="w-full animate-in fade-in duration-300">
        <StepHeader num={3} total={5} title="TYPE DE VÉHICULE" crumbs={`${selectedBrand} · ${powerLabel}`} />
        <div className="grid w-full" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 2 }}>
          {bikeTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => { setSelectedType(type.id); fetchModels(selectedBrand, selectedPower as PowerCategory, type.id); }}
              className="card text-left transition-all duration-150"
              style={{ padding: "22px 18px", cursor: "pointer" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-accent)";
                (e.currentTarget as HTMLElement).style.background = "var(--accent-dim)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.background = "var(--bg-1)";
              }}
            >
              <div className="uppercase mb-2" style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 15, fontWeight: 900, color: "var(--text)", letterSpacing: "0.03em" }}>
                {type.label}
              </div>
              <div className="mono" style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.08em" }}>{type.desc}</div>
              <div className="label" style={{ marginTop: 14, color: "var(--accent)", opacity: 0 }} data-hover-show>
                SÉLECTIONNER →
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  }

  /* ─── ÉTAPE 4 ─── */
  if (step === 4) {
    return (
      <section className="w-full animate-in fade-in duration-300">
        <StepHeader num={4} total={5} title="CHOIX DU MODÈLE" crumbs={`${selectedBrand} · ${typeLabel} · ${powerLabel}`} />

        {loadingModels && <Loader label="EXTRACTION DES MODÈLES..." />}
        {modelsError && <ErrorBox msg={modelsError} onBack={() => setStep(3)} />}

        {!loadingModels && !modelsError && models.length > 0 && (
          <div className="grid w-full" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 2 }}>
            {models.map((model) => (
              <button
                key={model}
                onClick={() => fetchModelYears(selectedBrand, model)}
                className="card flex items-center justify-between transition-all duration-150"
                style={{ padding: "16px 18px", cursor: "pointer" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-accent)";
                  (e.currentTarget as HTMLElement).style.background = "var(--accent-dim)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-1)";
                }}
              >
                <span className="uppercase" style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 14, fontWeight: 900, color: "var(--text)", letterSpacing: "0.03em" }}>
                  {model}
                </span>
                <span className="label" style={{ fontSize: 9, color: "var(--accent)" }}>→</span>
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  /* ─── ÉTAPE 5 ─── */
  if (step === 5) {
    return (
      <section className="w-full animate-in fade-in duration-300">
        <StepHeader num={5} total={5} title="ANNÉE" crumbs={`MODÈLE — ${selectedModel || selectedBrand}`} />

        {loadingYears && <Loader label="CHARGEMENT DES ANNÉES..." />}

        {!loadingYears && availableYears.length > 0 && (
          <div className="grid w-full" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 2 }}>
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => fetchBikeSpecs(selectedBrand, selectedModel || selectedBrand, year)}
                className="card transition-all duration-150"
                style={{ padding: "22px 8px", textAlign: "center", cursor: "pointer" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "var(--accent)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
                  const span = e.currentTarget.querySelector("span") as HTMLElement;
                  if (span) span.style.color = "#0A0A0A";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "var(--bg-1)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  const span = e.currentTarget.querySelector("span") as HTMLElement;
                  if (span) span.style.color = "var(--text)";
                }}
              >
                <span style={{ fontFamily: "'Arial Black', sans-serif", fontSize: 20, fontWeight: 900, color: "var(--text)", letterSpacing: "0.02em" }}>
                  {year}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  return null;
}