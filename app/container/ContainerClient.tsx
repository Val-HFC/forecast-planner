"use client";

import { useState, useEffect } from "react";
import type { Product } from "../types";
import { CONTAINER_20FT_CBM, CONTAINER_20FT_MAX_KG, CONTAINER_TARGET_FILL_PCT } from "../types";

const PRODUCTS_KEY = "forecast_products";
const FORECAST_KEY = "forecast_market_data";
const CONTAINER_KEY = "forecast_container_qtys";

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

function cartonsNeeded(units: number, unitsPerCarton: number): number {
  return Math.ceil(units / unitsPerCarton);
}

export default function ContainerClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [market, setMarket] = useState<"AU" | "UK">("AU");

  useEffect(() => {
    const prods: Product[] = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]");
    setProducts(prods);

    const forecasts: Record<string, Record<string, ForecastInput>> = JSON.parse(localStorage.getItem(FORECAST_KEY) || "null") || { AU: {}, UK: {} };
    const savedQtys: Record<string, number> = JSON.parse(localStorage.getItem(CONTAINER_KEY) || "null") || {};

    // Default qtys from forecasted
    const initQtys: Record<string, number> = {};
    for (const p of prods) {
      const inp = forecasts.AU?.[p.sku] || { currentMonthlySales: 0, growthRate: 0, safetyStockPct: 15, leadTimeDays: 30 };
      initQtys[p.sku] = savedQtys[p.sku] ?? calcForecasted(inp);
    }
    setQtys(initQtys);
  }, []);

  function updateQty(sku: string, val: number) {
    setQtys((prev) => {
      const updated = { ...prev, [sku]: val };
      localStorage.setItem(CONTAINER_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function loadFromForecast() {
    const forecasts: Record<string, Record<string, ForecastInput>> = JSON.parse(localStorage.getItem(FORECAST_KEY) || "null") || { AU: {}, UK: {} };
    const newQtys: Record<string, number> = {};
    for (const p of products) {
      const inp = forecasts[market]?.[p.sku] || { currentMonthlySales: 0, growthRate: 0, safetyStockPct: 15, leadTimeDays: 30 };
      newQtys[p.sku] = calcForecasted(inp);
    }
    setQtys(newQtys);
    localStorage.setItem(CONTAINER_KEY, JSON.stringify(newQtys));
  }

  // Calculate container stats
  const rows = products.map((p) => {
    const qty = qtys[p.sku] ?? 0;
    const cartons = cartonsNeeded(qty, p.unitsPerCarton);
    const cbm = cartons * p.cbmPerCarton;
    const weight = cartons * p.weightKg;
    return { ...p, qty, cartons, cbm, weight };
  });

  const totalCBM = rows.reduce((s, r) => s + r.cbm, 0);
  const totalWeight = rows.reduce((s, r) => s + r.weight, 0);
  const fillPct = (totalCBM / CONTAINER_20FT_CBM) * 100;
  const weightPct = (totalWeight / CONTAINER_20FT_MAX_KG) * 100;
  const remainingCBM = CONTAINER_20FT_CBM - totalCBM;
  const remainingKg = CONTAINER_20FT_MAX_KG - totalWeight;
  const atTarget = fillPct >= CONTAINER_TARGET_FILL_PCT * 100;

  const fillBarColor = fillPct > 100 ? "bg-red-500" : fillPct >= 90 ? "bg-green-500" : fillPct >= 70 ? "bg-yellow-400" : "bg-blue-400";

  // Add-on suggestions: products with remaining capacity
  const addOnSuggestions = products
    .map((p) => {
      if (remainingCBM <= 0 || remainingKg <= 0) return null;
      const maxByWeight = Math.floor(remainingKg / p.weightKg);
      const maxByCBM = Math.floor(remainingCBM / p.cbmPerCarton);
      const extraCartons = Math.min(maxByWeight, maxByCBM);
      if (extraCartons <= 0) return null;
      return { sku: p.sku, name: p.name, extraCartons, extraUnits: extraCartons * p.unitsPerCarton, extraCBM: extraCartons * p.cbmPerCarton };
    })
    .filter(Boolean);

  if (products.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Container Optimiser</h1>
        <p className="text-gray-400 text-sm">No products found. <a href="/products" className="text-blue-600 underline">Add products first.</a></p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Container Optimiser</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500">Load from forecast:</label>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value as "AU" | "UK")}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="AU">AU</option>
            <option value="UK">UK</option>
          </select>
          <button onClick={loadFromForecast} className="bg-blue-600 text-white text-sm rounded px-3 py-1.5 hover:bg-blue-700">
            Load
          </button>
        </div>
      </div>

      {/* Fill Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Container Fill (20ft — 33 CBM)</span>
          <span className={`font-bold ${fillPct > 100 ? "text-red-600" : fillPct >= 90 ? "text-green-600" : "text-yellow-600"}`}>
            {fillPct.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-1 overflow-hidden">
          <div className={`h-4 rounded-full transition-all ${fillBarColor}`} style={{ width: `${Math.min(fillPct, 100)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{totalCBM.toFixed(2)} CBM used</span>
          <span>{remainingCBM > 0 ? `${remainingCBM.toFixed(2)} CBM remaining` : "OVER capacity"}</span>
        </div>

        <div className="mt-3 flex gap-6 text-sm">
          <div>
            <span className="text-gray-500">Weight: </span>
            <span className={weightPct > 100 ? "text-red-600 font-bold" : "font-medium"}>
              {totalWeight.toLocaleString()} kg ({weightPct.toFixed(1)}%)
            </span>
            <span className="text-gray-400 ml-1">/ {CONTAINER_20FT_MAX_KG.toLocaleString()} kg</span>
          </div>
          <div>
            <span className="text-gray-500">Target: </span>
            <span className={atTarget ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
              {atTarget ? "✓ At 95% target" : `${(CONTAINER_TARGET_FILL_PCT * 100 - fillPct).toFixed(1)}% below target`}
            </span>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              {["SKU", "Name", "Order Qty", "Cartons", "CBM Used", "Weight (kg)", "Fill %"].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.sku} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs">{r.sku}</td>
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={r.qty || ""}
                    onChange={(e) => updateQty(r.sku, parseInt(e.target.value) || 0)}
                    className="w-24 border border-gray-300 rounded px-2 py-0.5 text-sm"
                  />
                </td>
                <td className="px-4 py-2">{r.cartons}</td>
                <td className="px-4 py-2">{r.cbm.toFixed(3)}</td>
                <td className="px-4 py-2">{r.weight.toFixed(1)}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="h-2 rounded-full bg-blue-400" style={{ width: `${Math.min((r.cbm / CONTAINER_20FT_CBM) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{((r.cbm / CONTAINER_20FT_CBM) * 100).toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-medium">
            <tr>
              <td colSpan={4} className="px-4 py-2 text-sm">Totals</td>
              <td className="px-4 py-2 text-sm">{totalCBM.toFixed(3)}</td>
              <td className="px-4 py-2 text-sm">{totalWeight.toFixed(1)}</td>
              <td className="px-4 py-2 text-sm">{fillPct.toFixed(1)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add-on suggestions */}
      {!atTarget && addOnSuggestions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-sm text-yellow-800 mb-2">💡 Space Remaining — Suggested Add-ons</h3>
          <p className="text-xs text-yellow-700 mb-3">You have {remainingCBM.toFixed(2)} CBM and {remainingKg.toLocaleString()} kg remaining. Consider adding:</p>
          <div className="flex flex-wrap gap-2">
            {addOnSuggestions.slice(0, 5).map((s) => s && (
              <div key={s.sku} className="bg-white border border-yellow-200 rounded px-3 py-2 text-xs">
                <span className="font-mono font-medium">{s.sku}</span> — up to <strong>{s.extraCartons}</strong> extra cartons
                ({s.extraUnits} units, {s.extraCBM.toFixed(2)} CBM)
              </div>
            ))}
          </div>
        </div>
      )}

      {fillPct > 100 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm font-medium">⚠️ Over capacity by {(totalCBM - CONTAINER_20FT_CBM).toFixed(2)} CBM. Reduce quantities or split across two containers.</p>
        </div>
      )}
    </div>
  );
}
