import { NextResponse } from 'next/server';
import type { ApiNinjasBike, BikeSpecs } from '@/types/bike';
import { bikeExpertAgent } from '@/mastra';

const FALLBACK = 'À confirmer';

type Enrichment = Omit<BikeSpecs, 'brand' | 'model' | 'year'>;

function hasValue(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && value.trim().toUpperCase() !== 'N/A';
}

function cleanText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function choose(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (
      typeof value === 'string' &&
      value.trim() !== '' &&
      value.trim() !== FALLBACK &&
      value.trim().toUpperCase() !== 'N/A'
    ) {
      return cleanText(value);
    }
  }
  return FALLBACK;
}

function extractFirstNumber(raw?: string | null): string | null {
  if (!raw) return null;
  const match = raw.match(/(\d+(?:[.,]\d+)?)/);
  return match ? match[1].replace(',', '.') : null;
}

function formatRpm(raw?: string | null): string | null {
  if (!raw) return null;

  const atMatch = raw.match(/@\s*(\d[\d\s.]*)/);
  if (!atMatch) return null;

  const rpm = atMatch[1].replace(/[^\d]/g, '');
  if (!rpm) return null;

  return `${Number(rpm).toLocaleString('fr-FR')} tr/min`;
}

function normalizeYoutubeSoundId(value: unknown) {
  if (typeof value !== 'string') return '';
  const cleaned = value.trim();
  const match = cleaned.match(/[A-Za-z0-9_-]{11}/);
  return match ? match[0] : '';
}

function normalizeIssues(value: unknown) {
  if (!Array.isArray(value)) {
    return [
      'Contrôler le suivi d’entretien et l’historique des révisions.',
      'Vérifier l’état des consommables et des éléments d’usure.',
      'Inspecter les éventuels rappels, jeux mécaniques et suintements.',
    ];
  }

  const items = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => cleanText(item))
    .filter(Boolean)
    .slice(0, 3);

  while (items.length < 3) {
    items.push('Vérifier l’état général et l’entretien courant.');
  }

  return items;
}

function cleanAndExtractJson(text: string) {
  let cleaned = text.replace(/```json|```/gi, '').replace(/^\uFEFF/, '').trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Aucun JSON exploitable trouvé. Réponse brute: ${cleaned.slice(0, 400)}`);
  }

  cleaned = cleaned.slice(start, end + 1);

  cleaned = cleaned
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\u0000-\u001F]/g, ' ');

  return cleaned;
}

function parseAgentJson(text: string): Record<string, unknown> {
  const candidate = cleanAndExtractJson(text);
  return JSON.parse(candidate) as Record<string, unknown>;
}

function translateCommon(raw?: string | null) {
  if (!hasValue(raw)) return null;

  return cleanText(raw)
    .replace(/In-line four/gi, '4 cylindres en ligne')
    .replace(/In-line three/gi, '3 cylindres en ligne')
    .replace(/In-line two/gi, '2 cylindres en ligne')
    .replace(/Single cylinder/gi, 'monocylindre')
    .replace(/V-twin/gi, 'bicylindre en V')
    .replace(/Parallel twin/gi, 'bicylindre parallèle')
    .replace(/four-stroke/gi, '4 temps')
    .replace(/two-stroke/gi, '2 temps')
    .replace(/Double Overhead Cams\/Twin Cam \(DOHC\)/gi, 'double arbre à cames en tête (DOHC)')
    .replace(/Double Overhead Cams/gi, 'double arbre à cames en tête')
    .replace(/Chain\s*\(final drive\)/gi, 'transmission finale par chaîne')
    .replace(/Belt\s*\(final drive\)/gi, 'transmission finale par courroie')
    .replace(/Shaft drive/gi, 'transmission finale par cardan')
    .replace(/\bLiquid\b/gi, 'liquide')
    .replace(/\bAir\b/gi, 'air')
    .replace(/Double disc/gi, 'double disque')
    .replace(/Single disc/gi, 'simple disque')
    .replace(/Hydraulic/gi, 'hydraulique')
    .replace(/adjustable preload/gi, 'précharge réglable')
    .replace(/compression and rebound/gi, 'compression et détente')
    .replace(/inverted fork/gi, 'fourche inversée')
    .replace(/Upside-down telescopic fork/gi, 'fourche télescopique inversée')
    .replace(/Single shock/gi, 'mono-amortisseur')
    .replace(/Wet sump/gi, 'carter humide')
    .replace(/Wet sump lubrication/gi, 'lubrification par carter humide')
    .replace(/assist and slipper clutch/gi, 'assisté et anti-dribble')
    .replace(/Multiplate/gi, 'multidisque')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDisplacement(raw?: string | null) {
  const number = extractFirstNumber(raw);
  return number ? `${number} cm³` : translateCommon(raw);
}

function formatPower(raw?: string | null) {
  if (!hasValue(raw)) return null;
  const power = extractFirstNumber(raw);
  const rpm = formatRpm(raw);
  if (!power) return translateCommon(raw);
  return rpm ? `${power} ch à ${rpm}` : `${power} ch`;
}

function formatTorque(raw?: string | null) {
  if (!hasValue(raw)) return null;
  const torque = extractFirstNumber(raw);
  const rpm = formatRpm(raw);
  if (!torque) return translateCommon(raw);
  return rpm ? `${torque} Nm à ${rpm}` : `${torque} Nm`;
}

function formatWeight(raw?: string | null) {
  const number = extractFirstNumber(raw);
  return number ? `${number} kg` : translateCommon(raw);
}

function formatGearbox(raw?: string | null) {
  if (!hasValue(raw)) return null;

  const gears = raw.match(/(\d+)-speed/i);
  if (gears) {
    return `boîte ${gears[1]} rapports`;
  }

  return translateCommon(raw);
}

function formatTransmission(raw?: string | null) {
  if (!hasValue(raw)) return null;
  const translated = translateCommon(raw);
  if (!translated) return null;

  if (translated.toLowerCase().includes('chaîne')) return 'transmission finale par chaîne';
  if (translated.toLowerCase().includes('courroie')) return 'transmission finale par courroie';
  if (translated.toLowerCase().includes('cardan')) return 'transmission finale par cardan';

  return translated;
}

function formatCooling(raw?: string | null) {
  if (!hasValue(raw)) return null;
  const translated = translateCommon(raw)?.toLowerCase();
  if (!translated) return null;

  if (translated === 'liquide') return 'refroidissement liquide';
  if (translated === 'air') return 'refroidissement par air';

  return translated.startsWith('refroidissement') ? translated : `refroidissement ${translated}`;
}

function formatSeatHeight(raw?: string | null) {
  const number = extractFirstNumber(raw);
  return number ? `${number} mm` : translateCommon(raw);
}

function formatFuelCapacity(raw?: string | null) {
  const number = extractFirstNumber(raw);
  return number ? `${number} litres` : translateCommon(raw);
}

function formatFuelConsumption(raw?: string | null) {
  const number = extractFirstNumber(raw);
  return number ? `${number} l/100 km` : translateCommon(raw);
}

function formatSimpleMetric(raw?: string | null) {
  return translateCommon(raw);
}

function buildAgentPrompt(
  brand: string,
  model: string,
  year: string,
  raw: ApiNinjasBike | null
) {
  const apiSnapshot = raw
    ? JSON.stringify(raw, null, 2)
    : 'Aucune donnée API-Ninjas disponible pour cette moto.';

  return `Tu es un expert moto francophone.

Ta mission :
1. Traduire et reformuler TOUTES les données techniques en FRANÇAIS
2. Compléter les champs manquants avec des valeurs réalistes et cohérentes pour le modèle exact
3. Ne jamais écrire de valeur en anglais
4. Ne jamais répondre avec N/A, null ou undefined
5. Répondre uniquement avec un objet JSON strictement valide

Moto :
- marque : ${brand}
- modèle : ${model}
- marque : ${brand}
- modèle EXACT : ${model}
- année EXACTE du millésime demandé : ${year}

  IMPORTANT : tu décris UNIQUEMENT le modèle "${model}" pour l'année ${year}.
  Ne pas confondre avec d'autres variantes ou avec l'histoire générale de la gamme.
  Le champ "history" doit parler du modèle "${model}" spécifiquement, pas de ses ancêtres.
  Le champ "vsLastYear" compare ${year} avec ${Number(year) - 1}, pas avec une autre génération.

Données brutes API :
${apiSnapshot}

Règles très importantes :
- toutes les unités doivent être en français
- si la source dit "Liquid", répondre "refroidissement liquide"
- si la source dit "In-line three, four-stroke", répondre "3 cylindres en ligne, 4 temps"
- si la source dit "6-speed", répondre "boîte 6 rapports"
- si une donnée exacte manque, fais une estimation réaliste spécifique au modèle
- youtubeSoundId doit être une chaîne vide "" sauf si tu es ABSOLUMENT certain de l’identifiant exact
- anecdote, history, innovations et vsLastYear doivent être en français naturel
- issues doit contenir exactement 3 chaînes

Format JSON obligatoire :
{
  "displacement": "890 cm³",
  "engine": "3 cylindres en ligne, 4 temps, DOHC",
  "power": "119 ch à 10 000 tr/min",
  "torque": "93 Nm à 7 000 tr/min",
  "weight": "193 kg tous pleins faits",
  "transmission": "transmission finale par chaîne",
  "gearbox": "boîte 6 rapports",
  "frame": "cadre aluminium type diamant",
  "compression": "11.5:1",
  "boreStroke": "78.0 x 62.1 mm",
  "cooling": "refroidissement liquide",
  "clutch": "embrayage multidisque en bain d’huile assisté et anti-dribble",
  "frontBrakes": "double disque avec ABS",
  "rearBrakes": "simple disque avec ABS",
  "frontSuspension": "fourche inversée réglable",
  "rearSuspension": "mono-amortisseur réglable",
  "frontTire": "120/70 ZR17",
  "rearTire": "180/55 ZR17",
  "seatHeight": "825 mm",
  "fuelCapacity": "14 litres",
  "fuelConsumption": "5.0 l/100 km",
  "firingOrder": "calage moteur exact",
  "youtubeSoundId": "",
  "anecdote": "2 à 3 phrases sur une seule ligne",
  "history": "3 à 4 phrases sur une seule ligne",
  "innovations": "2 à 3 phrases sur une seule ligne",
  "vsLastYear": "description sur une seule ligne",
  "issues": ["défaut 1", "défaut 2", "défaut 3"]
}`;
}

async function fetchApiNinjasBikes(params: URLSearchParams): Promise<ApiNinjasBike[]> {
  const apiKey = process.env.EXTERNAL_API_KEY ?? '';

  if (!apiKey) {
    console.warn('[/api/bike] EXTERNAL_API_KEY manquante');
    return [];
  }

  const res = await fetch(`https://api.api-ninjas.com/v1/motorcycles?${params.toString()}`, {
    headers: {
      'X-Api-Key': apiKey,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.warn('[/api/bike] API-Ninjas HTTP error:', res.status, res.statusText);
    return [];
  }

  const data = (await res.json()) as ApiNinjasBike[];
  return Array.isArray(data) ? data : [];
}

function parseLegacyQuery(query: string) {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  let year = '';

  if (tokens.length > 0 && /^\d{4}$/.test(tokens[tokens.length - 1])) {
    year = tokens.pop() ?? '';
  }

  const brand = tokens.shift() ?? '';
  const model = tokens.join(' ').trim();

  return { brand, model, year };
}

function defaultEnrichment(): Enrichment {
  return {
    displacement: FALLBACK,
    engine: FALLBACK,
    power: FALLBACK,
    torque: FALLBACK,
    weight: FALLBACK,
    transmission: FALLBACK,
    gearbox: FALLBACK,
    frame: FALLBACK,
    compression: FALLBACK,
    boreStroke: FALLBACK,
    cooling: FALLBACK,
    clutch: FALLBACK,
    frontBrakes: FALLBACK,
    rearBrakes: FALLBACK,
    frontSuspension: FALLBACK,
    rearSuspension: FALLBACK,
    frontTire: FALLBACK,
    rearTire: FALLBACK,
    seatHeight: FALLBACK,
    fuelCapacity: FALLBACK,
    fuelConsumption: FALLBACK,
    firingOrder: 'À confirmer',
    youtubeSoundId: '',
    anecdote: 'Informations complémentaires en cours de consolidation.',
    history: 'Historique du modèle en cours de consolidation.',
    innovations: 'Innovations techniques à confirmer pour ce millésime.',
    vsLastYear: 'Évolutions précises à confirmer par rapport au millésime précédent.',
    issues: [
      'Contrôler le suivi d’entretien et l’historique des révisions.',
      'Vérifier l’état des consommables et des éléments d’usure.',
      'Inspecter les éventuels rappels, jeux mécaniques et suintements.',
    ],
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let brand = typeof body.brand === 'string' ? body.brand.trim() : '';
    let model = typeof body.model === 'string' ? body.model.trim() : '';
    let year = body.year ? String(body.year).trim() : '';

    if ((!brand || !model) && typeof body.query === 'string' && body.query.trim() !== '') {
      const parsed = parseLegacyQuery(body.query);
      brand = brand || parsed.brand;
      model = model || parsed.model;
      year = year || parsed.year;
    }

    if (!brand || !model) {
      return NextResponse.json(
        { error: 'brand et model sont requis.' },
        { status: 400 }
      );
    }

    let raw: ApiNinjasBike | null = null;

    try {
      if (year) {
        const params = new URLSearchParams({
          make: brand,
          model,
          year,
        });

        const data = await fetchApiNinjasBikes(params);
        if (data.length > 0) {
          raw = data[0];
        }
      }

      if (!raw) {
        const params = new URLSearchParams({
          make: brand,
          model,
        });

        const data = await fetchApiNinjasBikes(params);

        if (data.length > 0) {
          if (year) {
            raw =
              data.find((bike) => String(bike.year) === String(year)) ??
              data.reduce((closest, bike) => {
                const currentDiff = Math.abs(Number(bike.year) - Number(year));
                const closestDiff = Math.abs(Number(closest.year) - Number(year));
                return currentDiff < closestDiff ? bike : closest;
              });
          } else {
            raw = data[0];
          }
        }
      }
    } catch (error) {
      console.warn('[/api/bike] API-Ninjas indisponible:', error);
    }

    let enrichment = defaultEnrichment();
    let rawAgentText = '';

    try {
      const prompt = buildAgentPrompt(brand, model, year, raw);

      const result = await bikeExpertAgent.generate([
        { role: 'user', content: prompt },
      ]);

      rawAgentText = result?.text ?? '';

      const parsed = parseAgentJson(rawAgentText);

      const stringKeys: (keyof Omit<Enrichment, 'issues'>)[] = [
        'displacement',
        'engine',
        'power',
        'torque',
        'weight',
        'transmission',
        'gearbox',
        'frame',
        'compression',
        'boreStroke',
        'cooling',
        'clutch',
        'frontBrakes',
        'rearBrakes',
        'frontSuspension',
        'rearSuspension',
        'frontTire',
        'rearTire',
        'seatHeight',
        'fuelCapacity',
        'fuelConsumption',
        'firingOrder',
        'youtubeSoundId',
        'anecdote',
        'history',
        'innovations',
        'vsLastYear',
      ];

      for (const key of stringKeys) {
        if (typeof parsed[key] === 'string' && parsed[key].trim() !== '') {
          if (key === 'youtubeSoundId') {
            enrichment.youtubeSoundId = normalizeYoutubeSoundId(parsed[key]);
          } else {
            enrichment[key] = cleanText(parsed[key] as string);
          }
        }
      }

      enrichment.issues = normalizeIssues(parsed.issues);
    } catch (error) {
      console.error('[/api/bike] Agent Mastra error:', error);
      console.error('[/api/bike] Agent Mastra raw:', rawAgentText);
    }

   const finalYear = year || (raw?.year ? String(raw.year) : '');

    const specs: BikeSpecs = {
      brand: choose(hasValue(raw?.make) ? raw.make : null, brand),
      model: choose(hasValue(raw?.model) ? raw.model : null, model),
      year: choose(finalYear),

      displacement: choose(enrichment.displacement, formatDisplacement(raw?.displacement)),
      engine: choose(enrichment.engine, translateCommon(raw?.engine)),
      power: choose(enrichment.power, formatPower(raw?.power)),
      torque: choose(enrichment.torque, formatTorque(raw?.torque)),
      weight: choose(
        enrichment.weight,
        formatWeight(raw?.dry_weight),
        formatWeight(raw?.total_weight)
      ),
      transmission: choose(enrichment.transmission, formatTransmission(raw?.transmission)),
      gearbox: choose(enrichment.gearbox, formatGearbox(raw?.gearbox)),
      frame: choose(enrichment.frame, formatSimpleMetric(raw?.frame)),
      compression: choose(enrichment.compression, formatSimpleMetric(raw?.compression)),
      boreStroke: choose(enrichment.boreStroke, formatSimpleMetric(raw?.bore_stroke)),
      cooling: choose(enrichment.cooling, formatCooling(raw?.cooling)),
      clutch: choose(enrichment.clutch, formatSimpleMetric(raw?.clutch)),
      frontBrakes: choose(enrichment.frontBrakes, formatSimpleMetric(raw?.front_brakes)),
      rearBrakes: choose(enrichment.rearBrakes, formatSimpleMetric(raw?.rear_brakes)),
      frontSuspension: choose(
        enrichment.frontSuspension,
        formatSimpleMetric(raw?.front_suspension)
      ),
      rearSuspension: choose(
        enrichment.rearSuspension,
        formatSimpleMetric(raw?.rear_suspension)
      ),
      frontTire: choose(enrichment.frontTire, formatSimpleMetric(raw?.front_tire)),
      rearTire: choose(enrichment.rearTire, formatSimpleMetric(raw?.rear_tire)),
      seatHeight: choose(enrichment.seatHeight, formatSeatHeight(raw?.seat_height)),
      fuelCapacity: choose(enrichment.fuelCapacity, formatFuelCapacity(raw?.fuel_capacity)),
      fuelConsumption: choose(
        enrichment.fuelConsumption,
        formatFuelConsumption(raw?.fuel_consumption)
      ),

      firingOrder: choose(enrichment.firingOrder),
      youtubeSoundId: enrichment.youtubeSoundId,
      anecdote: choose(enrichment.anecdote),
      history: choose(enrichment.history),
      innovations: choose(enrichment.innovations),
      vsLastYear: choose(enrichment.vsLastYear),
      issues: enrichment.issues,
    };

    return NextResponse.json({ specs });
  } catch (err) {
    console.error('[/api/bike]', err);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}