export type Product = {
  sku: string;
  name: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  unitsPerCarton: number;
  cbmPerCarton: number; // calculated: (lengthCm * widthCm * heightCm) / 1_000_000
};

export type MarketForecast = {
  market: 'AU' | 'UK';
  skuId: string;
  currentMonthlySales: number;
  growthRate: number; // percentage e.g. 10 = 10%
  safetyStockPct: number; // percentage e.g. 15 = 15%
  leadTimeDays: number;
  forecastedQty: number; // calculated
};

export type ContainerPlan = {
  products: { sku: string; qty: number }[];
  totalCBM: number;
  fillPct: number;
  totalWeight: number;
};

export type ProductionSplit = {
  totalProduction: number;
  auAllocation: number;
  ukAllocation: number;
  buffer: number;
  auDemand: number;
  ukDemand: number;
};

// Container constants
export const CONTAINER_20FT_CBM = 33;
export const CONTAINER_20FT_MAX_KG = 28000;
export const CONTAINER_TARGET_FILL_PCT = 0.95;
