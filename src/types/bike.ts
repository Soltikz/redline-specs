// src/types/bike.ts

export type PowerCategory = "125" | "a2" | "mid" | "hyper";

export interface PowerCategoryOption {
  id: string;
  label: string;
  desc: string;
  powerRange: string;
}

export interface ApiNinjasBike {
  make?: string;
  model?: string;
  year?: number | string;
  displacement?: string;
  engine?: string;
  power?: string;
  torque?: string;
  dry_weight?: string;
  total_weight?: string;
  transmission?: string;
  gearbox?: string;
  frame?: string;
  compression?: string;
  bore_stroke?: string;
  cooling?: string;
  clutch?: string;
  front_brakes?: string;
  rear_brakes?: string;
  front_suspension?: string;
  rear_suspension?: string;
  front_tire?: string;
  rear_tire?: string;
  seat_height?: string;
  fuel_capacity?: string;
  fuel_consumption?: string;
}

export interface BikeSpecs {
  brand: string;
  model: string;
  year: string;

  // ─── Moteur ───
  engine: string;
  displacement: string;
  power: string;
  torque: string;
  firingOrder?: string;
  compression?: string;
  boreStroke?: string;
  cooling?: string;
  clutch?: string;

  // ─── Transmission & châssis ───
  gearbox: string;
  transmission: string;
  frame?: string;
  frontSuspension?: string;
  rearSuspension?: string;
  frontBrakes?: string;
  rearBrakes?: string;

  // ─── Pneus & dimensions ───
  frontTire?: string;
  rearTire?: string;
  seatHeight?: string;
  fuelCapacity?: string;
  fuelConsumption?: string;
  weight: string;

  // ─── Contenu éditorial ───
  anecdote: string;
  history: string;
  innovations: string;
  vsLastYear: string;
  issues: string[];

  // ─── Media ───
  youtubeSoundId?: string;
}