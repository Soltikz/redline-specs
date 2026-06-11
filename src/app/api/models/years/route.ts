import { NextResponse } from 'next/server';
import type { ApiNinjasBike } from '@/types/bike';

const CURRENT_YEAR = 2026;

function normalize(str: string) {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

function buildRange(start: number, end: number) {
  const years: string[] = [];
  for (let y = end; y >= start; y -= 1) {
    years.push(String(y));
  }
  return years;
}

async function fetchApiYears(brand: string, model: string): Promise<number[]> {
  const apiKey = process.env.EXTERNAL_API_KEY ?? '';
  if (!apiKey) return [];

  const params = new URLSearchParams({ make: brand, model });

  const res = await fetch(
    `https://api.api-ninjas.com/v1/motorcycles?${params.toString()}`,
    { headers: { 'X-Api-Key': apiKey }, cache: 'no-store' }
  );

  if (!res.ok) return [];

  const data = (await res.json()) as ApiNinjasBike[];
  if (!Array.isArray(data)) return [];

  const target = normalize(model);
  const exactMatches = data.filter((bike) => normalize(bike.model ?? '') === target);

  const years = exactMatches
    .map((bike) => Number(bike.year))
    .filter((year) => Number.isFinite(year) && year >= 1950 && year <= CURRENT_YEAR);

  return Array.from(new Set(years)).sort((a, b) => a - b);
}

async function fetchGroqRange(brand: string, model: string) {
  const apiKey = process.env.GROQ_API_KEY ?? '';
  if (!apiKey) return null;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 60,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Tu es un expert moto. Réponds UNIQUEMENT avec ce JSON, rien d'autre :
{"startYear":XXXX,"endYear":XXXX,"currentProduction":true}
Remplace XXXX par les années réelles. Pas de texte, pas d'explication.`,
        },
        {
          role: 'user',
          content: `Plage de production exacte du sous-modèle "${model}" de ${brand}. Pas la gamme générale, ce sous-modèle précis.`,
        },
      ],
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? '';

  try {
    const parsed = JSON.parse(content);
    const startYear = typeof parsed.startYear === 'number' ? parsed.startYear : null;
    const endYear = typeof parsed.endYear === 'number' ? parsed.endYear : null;
    const currentProduction = Boolean(parsed.currentProduction);

    if (!startYear || !endYear) return null;
    if (startYear < 1950 || endYear > CURRENT_YEAR || startYear > endYear) return null;

    return {
      startYear,
      endYear: currentProduction ? CURRENT_YEAR : endYear,
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const brand = typeof body.brand === 'string' ? body.brand.trim() : '';
    const model = typeof body.model === 'string' ? body.model.trim() : '';

    if (!brand || !model) {
      return NextResponse.json(
        { error: 'brand et model sont requis.' },
        { status: 400 }
      );
    }

    const [apiYears, aiRange] = await Promise.all([
      fetchApiYears(brand, model),
      fetchGroqRange(brand, model),
    ]);

    if (aiRange) {
      const allYears = [...apiYears, aiRange.startYear, aiRange.endYear];
      const minYear = Math.min(...allYears);
      const maxYear = Math.max(...allYears);

      return NextResponse.json({
        years: buildRange(minYear, maxYear),
      });
    }

    if (apiYears.length >= 1) {
      return NextResponse.json({
        years: buildRange(apiYears[0], apiYears[apiYears.length - 1]),
      });
    }

    return NextResponse.json({
      years: [String(CURRENT_YEAR)],
    });

  } catch (err) {
    console.error('[/api/models/years]', err);
    return NextResponse.json({
      years: [String(CURRENT_YEAR)],
    });
  }
}