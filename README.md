# Redline Specs Qwen

Application Next.js pour générer des fiches techniques moto en français avec data API + IA.

## Vue d'ensemble

L'application propose un configurateur moto qui utilise trois API principales pour :

1. sélectionner des marques de moto (`/api/brands`)
2. filtrer les modèles selon catégorie de puissance et type (`/api/models`)
3. récupérer les années de production d'un modèle (`/api/models/years`)
4. générer une fiche technique détaillée enrichie par IA (`/api/bike`)

> Le flux principal est : marque → catégorie/type → modèle → année → fiche technique.

## Installation

```bash
npm install
```

Puis lancez le serveur de développement :

```bash
npm run dev
```

Ouvrez `http://localhost:3000` dans votre navigateur.

## Variables d'environnement

L'application utilise des clés externes pour l'API moto et l'IA :

- `EXTERNAL_API_KEY` : clé pour l'API Api-Ninjas
- `GROQ_API_KEY` : clé pour l'API Groq/OpenAI
- `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` : clé optionnelle pour récupérer des images depuis Unsplash

Exemple de `.env.local` :

```env
EXTERNAL_API_KEY=xxxxxxx
GROQ_API_KEY=yyyyyyy
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=zzzzzzz
```

## API disponibles

### 1. `/api/brands`

Renvoie la liste des marques disponibles.

- Méthode : `GET`
- Requête : aucun corps attendu
- Réponse :

```json
{
  "brands": ["Yamaha", "Honda", "Kawasaki", ...],
  "hasMore": true
}
```

Le routeur pagine les marques par blocs et trie alphabétiquement.

### 2. `/api/models`

Filtre les modèles d'une marque selon la catégorie de puissance et le type de moto.

- Méthode : `POST`
- Corps JSON :

```json
{
  "brand": "Yamaha",
  "powerCategory": "mid",
  "type": "roadster"
}
```

- Réponse :

```json
{
  "models": ["MT-09", "Tracer 9", ...]
}
```

#### Rôle de l'IA

Cette route appelle l'IA Groq (`llama-3.3-70b-versatile`) pour trier la liste brute de modèles API et renvoyer uniquement ceux qui correspondent strictement à la catégorie de puissance demandée et au type de moto.

### 3. `/api/models/years`

Retourne les années de production pour un modèle donné.

- Méthode : `POST`
- Corps JSON :

```json
{
  "brand": "Yamaha",
  "model": "MT-09"
}
```

- Réponse :

```json
{
  "years": ["2020", "2021", "2022", ...]
}
```

#### Rôle de l'IA

Cette route croise les années extraites depuis l'API Api-Ninjas avec une estimation de plage de production calculée par l'IA. Si l'IA fournit un intervalle cohérent, le résultat contient toutes les années entre le début et la fin de production.

### 4. `/api/bike`

Génère la fiche technique complète d'une moto pour une année donnée.

- Méthode : `POST`
- Corps JSON :

```json
{
  "brand": "Yamaha",
  "model": "MT-09",
  "year": "2023"
}
```

- Réponse :

```json
{
  "specs": {
    "brand": "Yamaha",
    "model": "MT-09",
    "year": "2023",
    "engine": "3 cylindres en ligne, 4 temps, DOHC",
    "displacement": "889 cm³",
    "power": "119 ch à 10 000 tr/min",
    "torque": "93 Nm à 7 000 tr/min",
    "topSpeed": "240 km/h",
    "acceleration0To100": "3,7 s",
    "weight": "193 kg tous pleins faits",
    "transmission": "transmission finale par chaîne",
    "gearbox": "boîte 6 rapports",
    "frame": "cadre aluminium type diamant",
    "compression": "11.5:1",
    "boreStroke": "78.0 x 62.1 mm",
    "cooling": "refroidissement liquide",
    "clutch": "embrayage multidisque assisté et anti-dribble",
    "frontBrakes": "double disque avec ABS",
    "rearBrakes": "simple disque avec ABS",
    "frontSuspension": "fourche inversée réglable",
    "rearSuspension": "mono-amortisseur réglable",
    "frontTire": "120/70 ZR17",
    "rearTire": "180/55 ZR17",
    "seatHeight": "825 mm",
    "fuelCapacity": "14 litres",
    "fuelConsumption": "5.0 l/100 km",
    "youtubeSoundId": "",
    "anecdote": "...",
    "history": "...",
    "innovations": "...",
    "vsLastYear": "...",
    "issues": ["...", "...", "..."]
  }
}
```

#### Rôle de l'IA

La route `/api/bike` utilise l'agent IA défini dans `src/mastra/agents/bikeExpert.ts` pour :

- normaliser et traduire les données techniques en français
- compléter les informations manquantes avec des estimations cohérentes pour le modèle exact
- produire des champs éditoriaux en français naturel (`anecdote`, `history`, `innovations`, `vsLastYear`)
- générer une liste de `issues` de trois points pertinents

Les données API brutes proviennent de l'API Api-Ninjas et sont enrichies / corrigées par l'IA.

## Architecture

- `src/app/page.tsx` : interface principale et navigation du configurateur
- `src/components/BrandSelection.tsx` : choix de la marque
- `src/components/ConfiguratorSteps.tsx` : étapes de sélection
- `src/components/BikeDashboard.tsx` : affichage de la fiche technique
- `src/components/SpecRow.tsx` : présentation d'une ligne de spécification
- `src/types/bike.ts` : types partagés et schéma de données
- `src/app/api/*` : API côté serveur
- `src/mastra/agents/bikeExpert.ts` : instructions et configuration de l'agent IA

## Points importants

- Les API utilisent `POST` pour accepter des paramètres dans le corps JSON.
- L'IA est appelée uniquement côté serveur et ne s'expose pas directement au navigateur.
- Si les données de l'API externe manquent, l'IA tente de générer des valeurs réalistes.
- Les champs `topSpeed` et `acceleration0To100` ont été ajoutés aux fiches techniques pour afficher la vitesse maximale et le 0-100 km/h.

## Tests et validation

Aucun test automatisé n'est inclus dans le dépôt actuel, mais vous pouvez vérifier le bon fonctionnement en lançant le projet et en naviguant dans le configurateur :

1. Choisir une marque
2. Sélectionner une catégorie de puissance
3. Choisir un type de moto
4. Sélectionner un modèle
5. Choisir une année

Le dashboard générera alors la fiche technique enrichie.

## Déploiement

Ce projet peut être déployé sur Vercel ou toute plateforme compatible Next.js. Assurez-vous d'ajouter les variables `EXTERNAL_API_KEY`, `GROQ_API_KEY` et `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` dans l'environnement de production.

---

Bonne exploration de la base moto et de l'IA embarquée !
