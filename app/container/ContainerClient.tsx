"use client";

import { useState, useEffect, useMemo } from "react";
import type { Product, CostInputs } from "../types";
import {
  CONTAINER_20FT_CBM,
  CONTAINER_20FT_MAX_KG,
  CONTAINER_TARGET_FILL_PCT,
  CONTAINER_LENGTH_M,
  CONTAINER_WIDTH_M,
  CONTAINER_HEIGHT_M,
  getBestOrientation,
} from "../types";

const PRODUCTS_KEY = "forecast_products";
const FORECAST_KEY = "forecast_market_data";
const CONTAINER_KEY = "forecast_container_qtys";
const COST_KEY = "forecast_cost_inputs";

type ForecastInput = {
  currentMonthlySales: number;
  growthRate: number;
  safetyStockPct: number;
  leadTimeDays: number;
};

function calcForecasted(inp: ForecastInput): number {
  const monthly = inp.currentMonthlySales * (1 + inp.growthRate / 100);
  const quarterly = monthly * 3;
  const withSafety = quarterly * (1 + inp.safetyStockPct / 100);
  return Math.ceil(withSafety);
}

type ContainerRow = {
  sku: string;
  name: string;
  qty: number;
  unitsPerCarton: number;
  cartons: number;
  cbmPerCarton: number;
  cbm: number;
  weightKg: number;
  weight: number;
  bestOrientation: string;
  maxFitUnits: number;
  fillPct: number;
};

function computeRows(products: Product[], qtys: Record<string, number>): ContainerRow[] {
  return products.map((p) => {
    const qty = qtys[p.sku] ?? 0;
    const cartons = Math.ceil(qty / p.unitsPerCarton);
    const cbm = cartons * p.cbmPerCarton;
    const weight = cartons * p.weightKg;
    const best = getBestOrientation(p.lengthCm, p.widthCm, p.heightCm);
    return {
      sku: p.sku,
      name: p.name,
      qty,
      unitsPerCarton: p.unitsPerCarton,
      cartons,
      cbmPerCarton: p.cbmPerCarton,
      cbm,
      weightKg: p.weightKg,
      weight,
      bestOrientation: best.orientation.label,
      maxFitUnits: best.totalUnits * p.unitsPerCarton,
      fillPct: (cbm / CONTAINER_20FT_CBM) * 100,
    };
  });
}

function ContainerFillDiagram({ fillPct, weightPct, label }: { fillPct: number; weightPct: number; label: string }) {
  const clampedFill = Math.min(fillPct, 100);
  const barColor =
    fillPct > 100 ? "#ef4444" : fillPct >= 95 ? "#22c55e" : fillPct >= 80 ? "#eab308" : "#3b82f6";

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      {/* 3D-ish container box */}
      <div className="relative w-full max-w-[280px] h-[100px]">
        {/* Container outline */}
        <div className="absolute inset-0 border-2 border-gray-300 rounded-md bg-gray-50 overflow-hidden">
          {/* Fill */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out rounded-b-sm"
            style={{
              height: `${clampedFill}%`,
              background: `linear-gradient(to top, ${barColor}dd, ${barColor}88)`,
            }}
          />
          {/* Grid lines */}
          {[25, 50, 75].map((line) => (
            <div
              key={line}
              className="absolute left-0 right-0 border-t border-dashed border-gray-200"
              style={{ bottom: `${line}%` }}
            />
          ))}
          {/* Target line at 95% */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-green-600"
            style={{ bottom: "95%" }}
          >
            <span className="absolute -top-3 right-1 text-[8px] text-green-700 font-medium">95%</span>
          </div>
        </div>
        {/* Percentage overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-2xl font-bold drop-shadow-sm"
            style={{ color: fillPct > 60 ? "white" : "#374151" }}
          >
            {fillPct.toFixed(1)}%
          </span>
        </div>
      </div>
      {/* Weight bar */}
      <div className="w-full max-w-[280px]">
        <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
          <span>Weight</span>
          <span>{weightPct.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{
              width: `${Math.min(weightPct, 100)}%`,
              backgroundColor: weightPct > 100 ? "#ef4444" : "#6b7280",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function SuggestFullButton({
  products,
  qtys,
  onUpdate,
}: {
  products: Product[];
  qtys: Record<string, number>;
  onUpdate: (newQtys: Record<string, number>) => void;
}) {
  function suggestFull() {
    if (products.length === 0) return;
    const newQtys = { ...qtys };
    // Distribute remaining capacity proportionally
    let iterations = 0;
    while (iterations < 50) {
      const rows = computeRows(products, newQtys);
      const totalCBM = rows.reduce((s, r) => s + r.cbm, 0);
      const totalWeight = rows.reduce((s, r) => s + r.weight, 0);
      const remainingCBM = CONTAINER_20FT_CBM - totalCBM;
      const remainingKg = CONTAINER_20FT_MAX_KG - totalWeight;
      if (remainingCBM < 0.01 || remainingKg < 1) break;

      let added = false;
      for (const p of products) {
        const cbmPerUnit = p.cbmPerCarton / p.unitsPerCarton;
        const weightPerUnit = p.weightKg / p.unitsPerCarton;
        if (cbmPerUnit <= remainingCBM && weightPerUnit <= remainingKg) {
          const maxByCBM = Math.floor(remainingCBM / cbmPerUnit);
          const maxByWeight = Math.floor(remainingKg / weightPerUnit);
          const addUnits = Math.min(maxByCBM, maxByWeight, p.unitsPerCarton);
          if (addUnits > 0) {
            newQtys[p.sku] = (newQtys[p.sku] || 0) + addUnits;
            added = true;
            break;
          }
        }
      }
      if (!added) break;
      iterations++;
    }
    onUpdate(newQtys);
  }

  return (
    <button
      onClick={suggestFull}
      className="text-xs bg-green-600 text-white rounded-md px-3 py-1.5 hover:bg-green-700 transition font-medium"
    >
      Auto-fill to 100%
    </button>
  );
}

function MarketContainerPanel({
  market,
  products,
  qtys,
  onQtyChange,
  onBulkUpdate,
  costs,
}: {
  market: "AU" | "UK";
  products: Product[];
  qtys: Record<string, number>;
  onQtyChange: (sku: string, val: number) => void;
  onBulkUpdate: (newQtys: Record<string, number>) => void;
  costs: CostInputs;
}) {
  const rows = computeRows(products, qtys);
  const totalCBM = rows.reduce((s, r) => s + r.cbm, 0);
  const totalWeight = rows.reduce((s, r) => s + r.weight, 0);
  const totalUnits = rows.reduce((s, r) => s + r.qty, 0);
  const fillPct = (totalCBM / CONTAINER_20FT_CBM) * 100;
  const weightPct = (totalWeight / CONTAINER_20FT_MAX_KG) * 100;
  const numContainers = Math.ceil(totalCBM / CONTAINER_20FT_CBM);
  const wastedCBM = numContainers * CONTAINER_20FT_CBM - totalCBM;
  const containerCost = market === "AU" ? costs.containerCostAU : costs.containerCostUK;
  const totalShippingCost = numContainers * containerCost;
  const totalManufacturingCost = totalUnits * costs.costPerUnit;
  const totalLandedCost = totalManufacturingCost + totalShippingCost;
  const landedCostPerUnit = totalUnits > 0 ? totalLandedCost / totalUnits : 0;
  const shippingCostPerUnit = totalUnits > 0 ? totalShippingCost / totalUnits : 0;

  const accentColor = market === "AU" ? "blue" : "purple";
  const flagEmoji = market === "AU" ? "\u{1F1E6}\u{1F1FA}" : "\u{1F1EC}\u{1F1E7}";
  const marketName = market === "AU" ? "Australia" : "United Kingdom";

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className={`px-5 py-3 font-semibold text-sm flex items-center justify-between ${
          accentColor === "blue" ? "bg-blue-50 text-blue-800 border-b border-blue-100" : "bg-purple-50 text-purple-800 border-b border-purple-100"
        }`}
      >
        <span>
          {flagEmoji} {marketName} Container
        </span>
        <SuggestFullButton products={products} qtys={qtys} onUpdate={onBulkUpdate} />
      </div>

      {/* Container Visual + Stats */}
      <div className="px-5 py-4 grid grid-cols-2 gap-4 border-b border-gray-100">
        <ContainerFillDiagram fillPct={fillPct} weightPct={weightPct} label="Volume Fill" />
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Units", value: totalUnits.toLocaleString() },
            { label: "Containers", value: numContainers.toString() },
            { label: "CBM Used", value: `${totalCBM.toFixed(2)} / ${CONTAINER_20FT_CBM}` },
            { label: "Weight", value: `${totalWeight.toLocaleString()} kg` },
            { label: "Fill %", value: `${fillPct.toFixed(1)}%`, highlight: fillPct >= 95 },
            { label: "Wasted Space", value: `${wastedCBM.toFixed(2)} CBM` },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</div>
              <div
                className={`text-sm font-semibold ${
                  stat.highlight ? "text-green-600" : "text-gray-800"
                }`}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Summary */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-[10px] text-gray-400 uppercase">Mfg Cost</div>
            <div className="text-sm font-semibold text-gray-700">${totalManufacturingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase">Shipping</div>
            <div className="text-sm font-semibold text-gray-700">${totalShippingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase">Landed Total</div>
            <div className="text-sm font-bold text-gray-900">${totalLandedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase">Per Unit</div>
            <div className="text-sm font-bold text-gray-900">
              ${landedCostPerUnit.toFixed(2)}
              <span className="text-[10px] text-gray-400 ml-1">(+${shippingCostPerUnit.toFixed(2)} ship)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase">
            <tr>
              {["SKU", "Name", "Qty", "Ctns", "Best Orient.", "Max Fit", "CBM", "Weight", "Fill"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r) => (
              <tr key={r.sku} className="hover:bg-gray-50/50">
                <td className="px-3 py-1.5 font-mono text-[10px] text-gray-600">{r.sku}</td>
                <td className="px-3 py-1.5 text-gray-700 truncate max-w-[120px]">{r.name}</td>
                <td className="px-3 py-1.5">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={r.qty || ""}
                    onChange={(e) => onQtyChange(r.sku, parseInt(e.target.value) || 0)}
                    className="w-20 border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
                  />
                </td>
                <td className="px-3 py-1.5 text-gray-600">{r.cartons}</td>
                <td className="px-3 py-1.5 text-gray-500 font-mono text-[10px]">{r.bestOrientation}</td>
                <td className="px-3 py-1.5 text-gray-500">{r.maxFitUnits.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-gray-600">{r.cbm.toFixed(3)}</td>
                <td className="px-3 py-1.5 text-gray-600">{r.weight.toFixed(1)}</td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-1">
                    <div className="w-14 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(r.fillPct, 100)}%`,
                          backgroundColor: accentColor === "blue" ? "#3b82f6" : "#8b5cf6",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 w-9 text-right">{r.fillPct.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-medium text-xs">
            <tr>
              <td colSpan={2} className="px-3 py-2">
                Totals
              </td>
              <td className="px-3 py-2">{totalUnits.toLocaleString()}</td>
              <td className="px-3 py-2">{rows.reduce((s, r) => s + r.cartons, 0)}</td>
              <td colSpan={2} />
              <td className="px-3 py-2">{totalCBM.toFixed(3)}</td>
              <td className="px-3 py-2">{totalWeight.toFixed(1)}</td>
              <td className="px-3 py-2">{fillPct.toFixed(1)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Status Banner */}
      {fillPct > 100 && (
        <div className="px-5 py-2 bg-red-50 border-t border-red-200 text-red-700 text-xs font-medium">
          Over capacity by {(totalCBM - CONTAINER_20FT_CBM).toFixed(2)} CBM. Reduce quantities or use multiple containers.
        </div>
      )}
      {fillPct >= 95 && fillPct <= 100 && (
        <div className="px-5 py-2 bg-green-50 border-t border-green-200 text-green-700 text-xs font-medium">
          Container is FULL. Target fill achieved at {fillPct.toFixed(1)}%.
        </div>
      )}
    </div>
  );
}

export default function ContainerClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [auQtys, setAuQtys] = useState<Record<string, number>>({});
  const [ukQtys, setUkQtys] = useState<Record<string, number>>({});
  const [costs, setCosts] = useState<CostInputs>({
    containerCostAU: 5500,
    containerCostUK: 6500,
    costPerUnit: 2.5,
  });

  useEffect(() => {
    const prods: Product[] = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]");
    setProducts(prods);

    const forecasts: Record<string, Record<string, ForecastInput>> = JSON.parse(
      localStorage.getItem(FORECAST_KEY) || "null"
    ) || { AU: {}, UK: {} };

    const savedQtys: Record<string, Record<string, number>> = JSON.parse(
      localStorage.getItem(CONTAINER_KEY) || "null"
    ) || { AU: {}, UK: {} };

    const savedCosts: CostInputs = JSON.parse(localStorage.getItem(COST_KEY) || "null") || costs;
    setCosts(savedCosts);

    const defaultFc: ForecastInput = { currentMonthlySales: 0, growthRate: 0, safetyStockPct: 15, leadTimeDays: 30 };
    const initAU: Record<string, number> = {};
    const initUK: Record<string, number> = {};

    for (const p of prods) {
      initAU[p.sku] = savedQtys.AU?.[p.sku] ?? calcForecasted(forecasts.AU?.[p.sku] || defaultFc);
      initUK[p.sku] = savedQtys.UK?.[p.sku] ?? calcForecasted(forecasts.UK?.[p.sku] || defaultFc);
    }
    setAuQtys(initAU);
    setUkQtys(initUK);
  }, []);

  function saveQtys(au: Record<string, number>, uk: Record<string, number>) {
    localStorage.setItem(CONTAINER_KEY, JSON.stringify({ AU: au, UK: uk }));
  }

  function updateAuQty(sku: string, val: number) {
    setAuQtys((prev) => {
      const updated = { ...prev, [sku]: val };
      saveQtys(updated, ukQtys);
      return updated;
    });
  }

  function updateUkQty(sku: string, val: number) {
    setUkQtys((prev) => {
      const updated = { ...prev, [sku]: val };
      saveQtys(auQtys, updated);
      return updated;
    });
  }

  function bulkUpdateAU(newQtys: Record<string, number>) {
    setAuQtys(newQtys);
    saveQtys(newQtys, ukQtys);
  }

  function bulkUpdateUK(newQtys: Record<string, number>) {
    setUkQtys(newQtys);
    saveQtys(auQtys, newQtys);
  }

  function updateCost(field: keyof CostInputs, val: number) {
    setCosts((prev) => {
      const updated = { ...prev, [field]: val };
      localStorage.setItem(COST_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function loadFromForecast() {
    const forecasts: Record<string, Record<string, ForecastInput>> = JSON.parse(
      localStorage.getItem(FORECAST_KEY) || "null"
    ) || { AU: {}, UK: {} };
    const defaultFc: ForecastInput = { currentMonthlySales: 0, growthRate: 0, safetyStockPct: 15, leadTimeDays: 30 };
    const newAU: Record<string, number> = {};
    const newUK: Record<string, number> = {};
    for (const p of products) {
      newAU[p.sku] = calcForecasted(forecasts.AU?.[p.sku] || defaultFc);
      newUK[p.sku] = calcForecasted(forecasts.UK?.[p.sku] || defaultFc);
    }
    setAuQtys(newAU);
    setUkQtys(newUK);
    saveQtys(newAU, newUK);
  }

  if (products.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Container Optimiser</h1>
        <p className="text-gray-400 text-sm">
          No products found.{" "}
          <a href="/products" className="text-blue-600 underline">
            Add products first.
          </a>
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Container Optimiser</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            20ft container: {CONTAINER_LENGTH_M}m x {CONTAINER_WIDTH_M}m x {CONTAINER_HEIGHT_M}m ={" "}
            {CONTAINER_20FT_CBM} CBM, {CONTAINER_20FT_MAX_KG.toLocaleString()} kg max
          </p>
        </div>
        <button
          onClick={loadFromForecast}
          className="bg-blue-600 text-white text-sm rounded-lg px-4 py-2 hover:bg-blue-700 transition font-medium shadow-sm"
        >
          Load from Forecast
        </button>
      </div>

      {/* Cost Inputs */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cost Parameters</h2>
        <div className="flex flex-wrap gap-6">
          {[
            { label: "Manufacturing Cost / Unit ($)", field: "costPerUnit" as const, step: "0.01" },
            { label: "AU Container Shipping ($)", field: "containerCostAU" as const, step: "100" },
            { label: "UK Container Shipping ($)", field: "containerCostUK" as const, step: "100" },
          ].map((input) => (
            <div key={input.field} className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider">{input.label}</label>
              <input
                type="number"
                min="0"
                step={input.step}
                value={costs[input.field] || ""}
                onChange={(e) => updateCost(input.field, parseFloat(e.target.value) || 0)}
                className="w-32 border border-gray-200 rounded-md px-2.5 py-1.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-side AU and UK Container Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MarketContainerPanel
          market="AU"
          products={products}
          qtys={auQtys}
          onQtyChange={updateAuQty}
          onBulkUpdate={bulkUpdateAU}
          costs={costs}
        />
        <MarketContainerPanel
          market="UK"
          products={products}
          qtys={ukQtys}
          onQtyChange={updateUkQty}
          onBulkUpdate={bulkUpdateUK}
          costs={costs}
        />
      </div>

      {/* Orientation Reference */}
      <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Orientation Optimisation Reference
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          All 6 orientations tested per carton. Best fit shown below.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase">
              <tr>
                {["SKU", "Carton Dims (cm)", "Best Orientation", "Along L", "Along W", "Along H", "Max Cartons/Container", "Max Units/Container"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => {
                const best = getBestOrientation(p.lengthCm, p.widthCm, p.heightCm);
                return (
                  <tr key={p.sku} className="hover:bg-gray-50/50">
                    <td className="px-3 py-1.5 font-mono text-[10px]">{p.sku}</td>
                    <td className="px-3 py-1.5 text-gray-600">
                      {p.lengthCm} x {p.widthCm} x {p.heightCm}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-[10px] text-gray-700">{best.orientation.label}</td>
                    <td className="px-3 py-1.5 text-gray-600">{best.unitsAlongLength}</td>
                    <td className="px-3 py-1.5 text-gray-600">{best.unitsAlongWidth}</td>
                    <td className="px-3 py-1.5 text-gray-600">{best.unitsAlongHeight}</td>
                    <td className="px-3 py-1.5 text-gray-800 font-semibold">{best.totalUnits}</td>
                    <td className="px-3 py-1.5 text-gray-800 font-semibold">
                      {(best.totalUnits * p.unitsPerCarton).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
