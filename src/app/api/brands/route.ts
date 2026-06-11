import { NextResponse } from 'next/server';

const ALL_MOTORCYCLE_MAKES = [
  // Les incontournables
  'Yamaha', 'Honda', 'Kawasaki', 'Suzuki', 'BMW', 'Ducati', 'KTM', 'Triumph', 'Aprilia', 'Harley-Davidson',
  // Europe & Amériques
  'Aprilia', 'Benelli', 'Beta', 'Bimota', 'Buell', 'Cagiva', 'Can-Am', 'Derbi', 'Gas Gas', 'Gillera', 
  'Husaberg', 'Husqvarna', 'Indian', 'Massa', 'Mash', 'Moto Guzzi', 'MV Agusta', 'Norton', 'Peugeot', 
  'Piaggio', 'Polaris', 'Rieju', 'Royal Enfield', 'Sherco', 'SWM', 'Vespa', 'Victory', 'Voxan', 'Zero',
  // Constructeurs Asie & Émergents
  'Bajaj', 'Benelli', 'CFMoto', 'Chang Jiang', 'Daelim', 'Dafra', 'Dayun', 'Gogoro', 'Hero', 'Hyosung', 
  'Italika', 'Jawa', 'Keeway', 'Kymco', 'Lifan', 'Loncin', 'Malaguti', 'Modenas', 'Mondial', 'Moto Morini', 
  'Niu', 'QJMotor', 'Rieju', 'Shineray', 'Sky Team', 'Sym', 'TVS', 'Voge', 'Znen', 'Zongshen'
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '12', 10); // 12 marques par bloc de base

    // Tri unique par ordre alphabétique
    const uniqueSorted = Array.from(new Set(ALL_MOTORCYCLE_MAKES)).sort((a, b) =>
      a.localeCompare(b, 'fr')
    );

    // Calcul des segments pour le bouton "Voir Plus"
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedBrands = uniqueSorted.slice(0, endIndex);

    const hasMore = endIndex < uniqueSorted.length;

    return NextResponse.json({
      brands: paginatedBrands,
      hasMore
    });
  } catch {
    return NextResponse.json({ brands: ALL_MOTORCYCLE_MAKES.slice(0, 12), hasMore: true });
  }
}