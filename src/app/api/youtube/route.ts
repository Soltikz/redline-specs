// src/app/api/youtube/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brand, model, year } = body;

    if (!brand || !model) {
      return NextResponse.json({ videoId: '' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY ?? '';
    if (!apiKey) {
      return NextResponse.json({ videoId: '' });
    }

    const query = `${brand} ${model} ${year ?? ''} exhaust sound`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=relevance&maxResults=5&key=${apiKey}`;

    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    if (!res.ok || !data.items?.length) {
      return NextResponse.json({ videoId: '' });
    }

    // Filtre : préfère les vidéos avec "exhaust" ou "sound" ou "acceleration" dans le titre
    const keywords = ['exhaust', 'sound', 'acceleration', 'échappement', 'son'];
    const best =
      data.items.find((item: any) =>
        keywords.some((kw) =>
          item.snippet?.title?.toLowerCase().includes(kw)
        )
      ) ?? data.items[0];

    const videoId = best?.id?.videoId ?? '';
    return NextResponse.json({ videoId });
  } catch (err) {
    console.error('[/api/youtube]', err);
    return NextResponse.json({ videoId: '' });
  }
}