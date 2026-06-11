// src/app/page.tsx
"use client";
import { useMemo, useState } from "react";
import type {
  BikeSpecs,
  PowerCategory,
  PowerCategoryOption,
} from "@/types/bike";
import { BikeDashboard } from "@/components/BikeDashboard";
import { ConfiguratorSteps } from "@/components/ConfiguratorSteps";
import { HeroScreen } from "@/components/HeroScreen";
import { BrandSelection } from "@/components/BrandSelection";

const CURRENT_YEAR = 2026;
const TOP_15_MAKES = [
  "Yamaha",
  "Honda",
  "Kawasaki",
  "Suzuki",
  "BMW",
  "Ducati",
  "KTM",
  "Triumph",
  "Aprilia",
  "Harley-Davidson",
  "Royal Enfield",
  "Indian",
  "Moto Guzzi",
  "Husqvarna",
  "MV Agusta",
].sort((a, b) => a.localeCompare(b, "fr"));

const POWER_CATEGORIES: PowerCategoryOption[] = [
  {
    id: "125",
    label: "Permis A1",
    desc: "Cylindrée 125 cm³ · Idéal pour débuter en ville",
    powerRange: "≤ 15 ch",
  },
  {
    id: "a2",
    label: "Permis A2",
    desc: "L'accès progressif · Modèles d'origine ou bridables",
    powerRange: "≤ 47,5 ch",
  },
  {
    id: "mid",
    label: "Permis A",
    desc: "Polyvalence & roadsters · Le cœur du marché mondial",
    powerRange: "48 – 100 ch",
  },
  {
    id: "hyper",
    label: "HYPERSPORT",
    desc: "Machines de pointe · Réservé aux pilotes expérimentés",
    powerRange: "> 100 ch",
  },
];

const BIKE_TYPES = [
  {
    id: "roadster",
    label: "ROADSTER",
    desc: "Sensations pures, agilité et look agressif",
  },
  {
    id: "sportive",
    label: "SPORTIVE",
    desc: "Aérodynamisme, performances et ADN de piste",
  },
  {
    id: "trail",
    label: "TRAIL / ADVENTURE",
    desc: "Aventurières polyvalentes, route et chemins",
  },
  {
    id: "custom",
    label: "CUSTOM / CRUISER",
    desc: "Style rebelle, assise basse et gros couple",
  },
  {
    id: "scooter",
    label: "SCOOTER",
    desc: "Mobilité urbaine, confort et aspects pratiques",
  },
  {
    id: "routiere",
    label: "ROUTIÈRE / GT",
    desc: "Vaisseaux d'autoroute taillés pour le voyage",
  },
];

async function fetchJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const rawText = await res.text();
  const data: any = rawText ? JSON.parse(rawText) : {};
  if (!res.ok || data?.error) throw new Error(data?.error ?? "Erreur serveur.");
  return data as T;
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedPower, setSelectedPower] = useState<PowerCategory | "">("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingBike, setLoadingBike] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const [yearsError, setYearsError] = useState("");
  const [bikeError, setBikeError] = useState("");
  const [bike, setBike] = useState<BikeSpecs | null>(null);

  const powerLabel = useMemo(
    () => POWER_CATEGORIES.find((i) => i.id === selectedPower)?.label ?? "",
    [selectedPower],
  );
  const typeLabel = useMemo(
    () => BIKE_TYPES.find((i) => i.id === selectedType)?.label ?? "",
    [selectedType],
  );
  const youtubeSearchUrl = useMemo(
    () =>
      bike
        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(`${bike.brand} ${bike.model} ${bike.year} sound`)}`
        : "#",
    [bike],
  );

  const reset = () => {
    setStep(1);
    setSelectedBrand("");
    setSelectedPower("");
    setSelectedType("");
    setSelectedModel("");
    setSelectedYear("");
    setModels([]);
    setAvailableYears([]);
    setModelsError("");
    setYearsError("");
    setBikeError("");
    setBike(null);
  };

  const quitConfigurator = () => {
    reset();
    setStarted(false);
  };

  const goBack = () => {
    if (step === 1) {
      quitConfigurator();
      return;
    }
    if (step === 2) {
      setStep(1);
      setSelectedBrand("");
      return;
    }
    if (step === 3) {
      setStep(2);
      setSelectedPower("");
      return;
    }
    if (step === 4) {
      setStep(3);
      setSelectedType("");
      setModels([]);
      setModelsError("");
      return;
    }
    if (step === 5) {
      setStep(4);
      setSelectedModel("");
      setAvailableYears([]);
      setYearsError("");
      return;
    }
    if (step === 6) {
      setStep(5);
      setSelectedYear("");
      setBike(null);
      setBikeError("");
    }
  };

  const fetchModels = async (
    brand: string,
    powerCategory: PowerCategory,
    type: string,
  ) => {
    setLoadingModels(true);
    setModels([]);
    setModelsError("");
    setStep(4);
    try {
      const data = await fetchJson<{ models: string[] }>("/api/models", {
        brand,
        powerCategory,
        type,
      });
      setModels(data.models);
    } catch (err: any) {
      setModelsError(err.message);
    } finally {
      setLoadingModels(false);
    }
  };

  const fetchModelYears = async (brand: string, model: string) => {
    setLoadingYears(true);
    setYearsError("");
    setAvailableYears([]);
    setSelectedModel(model);
    setStep(5);
    try {
      const data = await fetchJson<{ years: string[] }>("/api/models/years", {
        brand,
        model,
      });
      setAvailableYears(data.years);
    } catch {
      setAvailableYears([String(CURRENT_YEAR)]);
    } finally {
      setLoadingYears(false);
    }
  };

  const fetchBikeSpecs = async (brand: string, model: string, year: string) => {
    setLoadingBike(true);
    setBike(null);
    setBikeError("");
    setSelectedYear(year);
    setStep(6);
    try {
      const data = await fetchJson<{ specs: BikeSpecs }>("/api/bike", {
        brand,
        model,
        year,
      });
      setBike(data.specs);
    } catch (err: any) {
      setBikeError(err.message);
    } finally {
      setLoadingBike(false);
    }
  };

  if (!started) return <HeroScreen onStart={() => setStarted(true)} />;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      {/* Accent top stripe */}
      <div className="stripe" />

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(10,10,10,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button
            onClick={goBack}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
              fontFamily: "'Geist Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              padding: "6px 14px",
              cursor: "pointer",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border-accent)";
              (e.currentTarget as HTMLElement).style.color = "var(--accent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
            }}
          >
            ← RETOUR
          </button>
          <div>
            <span
              className="uppercase"
              style={{
                fontFamily: "'Arial Black', sans-serif",
                fontSize: 14,
                fontWeight: 900,
                color: "var(--text)",
                letterSpacing: "0.05em",
                marginLeft: 12,
              }}
            >
              REDLINE <span style={{ color: "var(--accent)" }}>SPECS</span>
            </span>
          </div>
        </div>

        <button
          onClick={quitConfigurator}
          className="btn-ghost"
          style={{ padding: "6px 16px", fontSize: 10 }}
        >
          QUITTER
        </button>
      </header>

      {/* Progress bar (steps 1-5) */}
      {step <= 5 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            borderBottom: "1px solid var(--border)",
          }}
        >
          {[1, 2, 3, 4, 5].map((num) => (
            <div
              key={num}
              style={{
                flex: 1,
                height: 3,
                background: step >= num ? "var(--accent)" : "var(--bg-3)",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>
      )}

      {/* Main */}
      <main
        style={{
          width: "100%",
          maxWidth: 1280,
          margin: "0 auto",
          padding: "40px 24px 80px",
        }}
      >
        {step === 1 && (
          <BrandSelection
            topMakes={TOP_15_MAKES}
            onSelectBrand={(brand) => {
              setSelectedBrand(brand);
              setStep(2);
            }}
            onCustomBrandSubmit={(customBrand) => {
              setSelectedBrand(customBrand);
              setStep(2);
            }}
          />
        )}

        <ConfiguratorSteps
          step={step}
          setStep={setStep}
          selectedBrand={selectedBrand}
          selectedPower={selectedPower}
          setSelectedPower={setSelectedPower}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          bikeTypes={BIKE_TYPES}
          typeLabel={typeLabel}
          powerLabel={powerLabel}
          powerCategories={POWER_CATEGORIES}
          fetchModels={fetchModels}
          loadingModels={loadingModels}
          modelsError={modelsError}
          models={models}
          fetchModelYears={fetchModelYears}
          loadingYears={loadingYears}
          yearsError={yearsError}
          availableYears={availableYears}
          selectedModel={selectedModel}
          fetchBikeSpecs={fetchBikeSpecs}
        />

        {/* Step 6 — Results */}
        {step === 6 && (
          <section className="w-full animate-in fade-in duration-300">
            {loadingBike && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 20,
                  padding: "80px 0",
                  border: "1px solid var(--border)",
                  background: "var(--bg-1)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    border: "2px solid var(--bg-3)",
                    borderTopColor: "var(--accent)",
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <span className="label" style={{ color: "var(--text-3)" }}>
                  GÉNÉRATION DE LA FICHE TECHNIQUE...
                </span>
              </div>
            )}

            {bikeError && (
              <div
                style={{
                  border: "1px solid rgba(255,80,80,0.3)",
                  background: "rgba(255,80,80,0.05)",
                  padding: 32,
                }}
              >
                <p className="mono" style={{ fontSize: 13, color: "#ff6666" }}>
                  {bikeError}
                </p>
                <button
                  onClick={() => setStep(5)}
                  className="btn-ghost mt-4 px-5 py-3"
                  style={{ fontSize: 10 }}
                >
                  ← RETOUR
                </button>
              </div>
            )}

            {bike && (
              <BikeDashboard
                bike={bike}
                youtubeSearchUrl={youtubeSearchUrl}
                reset={reset}
              />
            )}
          </section>
        )}
      </main>
    </div>
  );
}
