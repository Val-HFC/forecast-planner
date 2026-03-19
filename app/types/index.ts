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

// 20ft container internal dimensions (meters)
export const CONTAINER_LENGTH_M = 5.9;
export const CONTAINER_WIDTH_M = 2.35;
export const CONTAINER_HEIGHT_M = 2.39;

// Container constants
export const CONTAINER_20FT_CBM = 33.2; // 5.9 * 2.35 * 2.39
export const CONTAINER_20FT_MAX_KG = 28000;
export const CONTAINER_TARGET_FILL_PCT = 0.95;

// Orientation type for container packing
export type Orientation = {
  label: string;
  l: number; // length along container length
  w: number; // width along container width
  h: number; // height along container height
};

// Calculate best orientation for a carton in the container
export function getBestOrientation(lengthCm: number, widthCm: number, heightCm: number): {
  orientation: Orientation;
  unitsAlongLength: number;
  unitsAlongWidth: number;
  unitsAlongHeight: number;
  totalUnits: number;
} {
  const dims = [lengthCm / 100, widthCm / 100, heightCm / 100]; // convert to meters
  const orientations: Orientation[] = [
    { label: 'L x W x H', l: dims[0], w: dims[1], h: dims[2] },
    { label: 'L x H x W', l: dims[0], w: dims[2], h: dims[1] },
    { label: 'W x L x H', l: dims[1], w: dims[0], h: dims[2] },
    { label: 'W x H x L', l: dims[1], w: dims[2], h: dims[0] },
    { label: 'H x L x W', l: dims[2], w: dims[0], h: dims[1] },
    { label: 'H x W x L', l: dims[2], w: dims[1], h: dims[0] },
  ];

  let best = { orientation: orientations[0], unitsAlongLength: 0, unitsAlongWidth: 0, unitsAlongHeight: 0, totalUnits: 0 };

  for (const o of orientations) {
    const nL = Math.floor(CONTAINER_LENGTH_M / o.l);
    const nW = Math.floor(CONTAINER_WIDTH_M / o.w);
    const nH = Math.floor(CONTAINER_HEIGHT_M / o.h);
    const total = nL * nW * nH;
    if (total > best.totalUnits) {
      best = { orientation: o, unitsAlongLength: nL, unitsAlongWidth: nW, unitsAlongHeight: nH, totalUnits: total };
    }
  }

  return best;
}

// Cost types
export type CostInputs = {
  containerCostAU: number;
  containerCostUK: number;
  costPerUnit: number; // manufacturing cost per unit
};
