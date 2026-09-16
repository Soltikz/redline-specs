// src/app/api/models/route.ts
import { NextResponse } from 'next/server';
import type { ApiNinjasBike, PowerCategory } from '@/types/bike';

function dedupe(models: string[]) {
  return Array.from(new Set(models.map((m) => m.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'fr', { sensitivity: 'base' })
  );
}

// L'IA prend maintenant la liste brute de l'API et applique les filtres mécaniques et de style de manière autonome
async function filterAndAugmentWithAi(
  brand: string, 
  powerCategory: PowerCategory, 
  type: string, 
  rawApiModels: string[]
): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY ?? '';
  console.log('[DEBUG] GROQ_API_KEY présente ?', apiKey ? `oui (${apiKey.slice(0, 4)}...)` : 'NON');
  if (!apiKey) return [];

  const categoryDescriptions: Record<PowerCategory, string> = {
    '125': 'Motos de 125cm³ max, puissance ≤ 15 ch (Permis A1/B). Strictement aucune moto de cylindrée supérieure.',
    'a2': 'Motos adaptées au permis A2 (Puissance maximale d’origine ou bridée ≤ 47,5 ch / 35 kW). Strictement aucun 125cm³, aucun gros cube non bridable.',
    'mid': 'Moyenne cylindrée (Puissance d’origine entre 48 ch et 100 ch). Exclure les 125, les pures A2 de moins de 47ch, et les hypersports.',
    'hyper': 'Gros cubes et pures performances (Puissance strictement > 100 ch). Machines lourdes ou pures sportives de pointe.'
  };

  const typeDescriptions: Record<string, string> = {
    'roadster': 'Motos de type Naked, sans carénage intégral, guidon droit, typées urbaines/routières sportives.',
    'sportive': 'Motos carénées typées piste ou vitesse (ex: gammes CBR-R, YZF-R, Ninja, GSX-R, Panigale).',
    'trail': 'Motos hautes, typées Trail, Adventure ou Dual-Sport, faites pour la route et le tout-terrain (ex: Ténéré, GS, Africa Twin).',
    'custom': 'Motos de style Cruiser, Low-rider, position pieds en avant, assise basse (ex: Harley-Davidson, Honda Rebel, Indian).',
    'scooter': 'Véhicules à plancher plat ou carénage scooter, transmission automatique/variateur, orientés ville ou maxi-scooter.',
    'routiere': 'Motos de Grand Tourisme (GT), grand carénage protecteur, valises, conçues pour le voyage au long cours (ex: Goldwing, RT, FJR).'
  };

  const promptMessage = `Marque : ${brand}
Catégorie de puissance demandée : ${categoryDescriptions[powerCategory]}
Type de carrosserie demandé : ${typeDescriptions[type] || type}

Voici une liste brute de modèles trouvés dans l'historique constructeur (qui peut contenir des erreurs de catégories, des quads ou des doublons) :
${JSON.stringify(rawApiModels)}

Mission : Renvoie un objet JSON contenant exclusivement les modèles de cette liste (ou des modèles réels oubliés de cette marque) qui matchent STRICTEMENT et simultanément avec la puissance ET le type demandé. Élimine sans pitié les hors-sujets (ex: pas de 125 en A2, pas de sportive en routière).`;

  console.log('[DEBUG] Prompt envoyé à Groq (brand/power/type):', brand, powerCategory, type);
  console.log('[DEBUG] rawApiModels count:', rawApiModels.length);

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        temperature: 0.1, // Basse température pour éviter que l'IA n'invente des catégories
        max_tokens: 1500, // gpt-oss consomme du budget en reasoning interne avant de répondre
        reasoning_effort: 'low', // limite le temps de "réflexion" pour laisser de la place à la réponse JSON
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Tu es un algorithme de filtrage d'encyclopédie moto ultra-strict. 
Tu dois analyser la demande et trier la liste fournie. Tu peux la compléter si elle contient moins de 5 modèles avec des vrais modèles connus de l'industrie.
Réponds UNIQUEMENT sous ce format JSON strict :
{ "models": ["Modèle Valide 1", "Modèle Valide 2"] }
Ne mets jamais le nom de la marque dans le nom du modèle. Ne mets aucun texte avant ou après le JSON.`,
          },
          {
            role: 'user',
            content: promptMessage,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[DEBUG] Groq API error:', res.status, res.statusText, errText);
      return [];
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    console.log('[DEBUG] Groq raw content:', content);

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseErr) {
      console.error('[DEBUG] JSON parse failed on Groq content:', content);
      return [];
    }

    console.log('[DEBUG] Groq parsed.models:', parsed?.models);

    return Array.isArray(parsed.models) 
      ? parsed.models.filter((m: unknown): m is string => typeof m === 'string') 
      : [];
  } catch (err) {
    console.error('[DEBUG] Error during AI filtering (network/exception):', err);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const brand = typeof body.brand === 'string' ? body.brand.trim() : '';
    const powerCategory = body.powerCategory as PowerCategory;
    const type = typeof body.type === 'string' ? body.type.trim().toLowerCase() : '';

    console.log('[DEBUG] POST /api/models body reçu:', { brand, powerCategory, type });

    if (!brand || !powerCategory || !type) {
      return NextResponse.json(
        { error: 'Les paramètres brand, powerCategory et type sont requis.' },
        { status: 400 }
      );
    }

    let rawApiModels: string[] = [];

    // 1. On récupère la base de données brute de la marque via l'API-Ninjas (sans filtrage manuel)
    try {
      const params = new URLSearchParams({ make: brand, limit: '100' });
      const apiRes = await fetch(
        `https://api.api-ninjas.com/v1/motorcycles?${params.toString()}`,
        {
          headers: { 'X-Api-Key': process.env.EXTERNAL_API_KEY ?? '' },
          cache: 'no-store',
        }
      );

      console.log('[DEBUG] API-Ninjas status:', apiRes.status);

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (Array.isArray(data)) {
          rawApiModels = data.map((bike: any) => bike.model?.trim() ?? '').filter(Boolean);
        }
      } else {
        console.warn('[DEBUG] API-Ninjas non-ok:', apiRes.status, await apiRes.text());
      }
    } catch (e) {
      console.warn('API-Ninjas inaccessible, l\'IA va travailler en autonomie complète.', e);
    }

    console.log('[DEBUG] rawApiModels après API-Ninjas:', rawApiModels);

    // 2. On passe la patate chaude à l'IA : c'est elle qui valide, trie, exclut et nettoie tout d'un coup
    const filteredModels = await filterAndAugmentWithAi(brand, powerCategory, type, dedupe(rawApiModels));
    const finalModels = dedupe(filteredModels);

    console.log('[DEBUG] finalModels:', finalModels);

    if (finalModels.length === 0) {
      return NextResponse.json(
        { error: 'Aucun modèle correspondant trouvé pour cette sélection.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      models: finalModels,
      source: 'ai_smart_filter',
    });

  } catch (err) {
    console.error('[/api/models] Global error:', err);
    return NextResponse.json(
      { error: 'Impossible de filtrer les modèles.' },
      { status: 500 }
    );
  }
}