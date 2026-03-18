"use client";

import { useState, useEffect } from "react";
import type { Product } from "../types";
import { CONTAINER_20FT_CBM } from "../types";

const PRODUCTS_KEY = "forecast_products";
const FORECAST_KEY = "forecast_market_data";

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

type SkuSplit = {
  sku: string;
  name: string;
  unitsPerCarton: number;
  cbmPerCarton: number;
  auDemand: number;
  ukDemand: number;
  totalDemand: number;
  auPct: number;
  ukPct: number;
  totalProduction: number;
  auAlloc: number;
  ukAlloc: number;
  buffer: number;
  auContainers: number;
  ukContainers: number;
  splitIssue: boolean;
};

export default function ProductionClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalBySkU, setTotalBySku] = useState<Record<string, number>>({});
  const [bufferPct, setBufferPct] = useState(5);

  useEffect(() => {
    const prods: Product[] = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]");
    setProducts(prods);

    const forecasts: Record<string, Record<string, ForecastInput>> = JSON.parse(localStorage.getItem(FORECAST_KEY) || "null") || { AU: {}, UK: {} };
    const defaults: ForecastInput = { currentMonthlySales: 0, growthRate: 0, safetyStockPct: 15, leadTimeDays: 30 };

    const totals: Record<string, number> = {};
    for (const p of prods) {
      const auDemand = calcForecasted(forecasts.AU?.[p.sku] || defaults);
      const ukDemand = calcForecasted(forecasts.UK?.[p.sku] || defaults);
      totals[p.sku] = auDemand + ukDemand;
    }
    setTotalBySku(totals);
  }, []);

  function updateTotal(sku: string, val: number) {
    setTotalBySku((prev) => ({ ...prev, [sku]: val }));
  }

  const splits: SkuSplit[] = products.map((p) => {
    const forecasts: Record<string, Record<string, ForecastInput>> = JSON.parse(localStorage.getItem(FORECAST_KEY) || "null") || { AU: {}, UK: {} };
    const defaults: ForecastInput = { currentMonthlySales: 0, growthRate: 0, safetyStockPct: 15, leadTimeDays: 30 };
    const auDemand = calcForecasted(forecasts.AU?.[p.sku] || defaults);
    const ukDemand = calcForecasted(forecasts.UK?.[p.sku] || defaults);
    const totalDemand = auDemand + ukDemand;
    const auPct = totalDemand > 0 ? auDemand / totalDemand : 0.5;
    const ukPct = totalDemand > 0 ? ukDemand / totalDemand : 0.5;
    const totalProduction = totalBySkU[p.sku] ?? totalDemand;
    const buffer = Math.ceil(totalProduction * (bufferPct / 100));
    const netProduction = totalProduction - buffer;
    const auAlloc = Math.round(netProduction * auPct);
    const ukAlloc = netProduction - auAlloc;

    const auCartons = Math.ceil(auAlloc / p.unitsPerCarton);
    const ukCartons = Math.ceil(ukAlloc / p.unitsPerCarton);
    const auCBM = auCartons * p.cbmPerCarton;
    const ukCBM = ukCartons * p.cbmPerCarton;
    const auContainerFraction = auCBM / CONTAINER_20FT_CBM;
    const ukContainerFraction = ukCBM / CONTAINER_20FT_CBM;
    const splitIssue =
      (auContainerFraction % 1 > 0.1 && auContainerFraction % 1 < 0.9) ||
      (ukContainerFraction % 1 > 0.1 && ukContainerFraction % 1 < 0.9);

    return {
      sku: p.sku,
      name: p.name,
      unitsPerCarton: p.unitsPerCarton,
      cbmPerCarton: p.cbmPerCarton,
      auDemand,
      ukDemand,
      totalDemand,
      auPct,
      ukPct,
      totalProduction,
      auAlloc,
      ukAlloc,
      buffer,
      auContainers: parseFloat(auContainerFraction.toFixed(2)),
      ukContainers: parseFloat(ukContainerFraction.toFixed(2)),
      splitIssue,
    };
  });

  const grandTotal = splits.reduce((s, r) => s + r.totalProduction, 0);
  const grandAU = splits.reduce((s, r) => s + r.auAlloc, 0);
  const grandUK = splits.reduce((s, r) => s + r.ukAlloc, 0);
  const grandBuffer = splits.reduce((s, r) => s + r.buffer, 0);

  if (products.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Production Split</h1>
        <p className="text-gray-400 text-sm">No products found. <a href="/products" className="text-blue-600 underline">Add products first.</a></p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Production Split</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Buffer %</label>
          <input
            type="number"
            min="0"
            max="50"
            step="1"
            value={bufferPct}
            onChange={(e) => setBufferPct(parseFloat(e.target.value) || 0)}
            className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Production", value: grandTotal.toLocaleString(), color: "text-gray-800" },
          { label: "AU Allocation", value: grandAU.toLocaleString(), color: "text-blue-700" },
          { label: "UK Allocation", value: grandUK.toLocaleString(), color: "text-purple-700" },
          { label: "Buffer Stock", value: grandBuffer.toLocaleString(), color: "text-green-700" },
        ].map((c) => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
            <div className="text-xs text-gray-400 mb-1">{c.label}</div>
            <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              {["SKU", "AU Demand", "UK Demand", "Total Run", "Buffer", "AU Alloc", "UK Alloc", "AU Ctrs", "UK Ctrs", "Flag"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {splits.map((r) => (
              <tr key={r.sku} className={r.splitIssue ? "bg-yellow-50" : "hover:bg-gray-50"}>
                <td className="px-3 py-2 font-mono text-xs">{r.sku}</td>
                <td className="px-3 py-2 text-blue-700">{r.auDemand.toLocaleString()}</td>
                <td className="px-3 py-2 text-purple-700">{r.ukDemand.toLocaleString()}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={r.totalProduction || ""}
                    onChange={(e) => updateTotal(r.sku, parseInt(e.target.value) || 0)}
                    className="w-24 border border-gray-300 rounded px-2 py-0.5 text-sm"
                  />
                </td>
                <td className="px-3 py-2 text-green-700">{r.buffer.toLocaleString()}</td>
                <td className="px-3 py-2 font-medium text-blue-800">{r.auAlloc.toLocaleString()}</td>
                <td className="px-3 py-2 font-medium text-purple-800">{r.ukAlloc.toLocaleString()}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{r.auContainers}×</td>
                <td className="px-3 py-2 text-xs text-gray-500">{r.ukContainers}×</td>
                <td className="px-3 py-2">
                  {r.splitIssue && (
                    <span className="text-xs text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded" title="Split doesn't fill containers evenly">
                      ⚠️ Adjust
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-medium">
            <tr>
              <td className="px-3 py-2 text-sm">Totals</td>
              <td className="px-3 py-2 text-sm text-blue-700">{splits.reduce((s, r) => s + r.auDemand, 0).toLocaleString()}</td>
              <td className="px-3 py-2 text-sm text-purple-700">{splits.reduce((s, r) => s + r.ukDemand, 0).toLocaleString()}</td>
              <td className="px-3 py-2 text-sm">{grandTotal.toLocaleString()}</td>
              <td className="px-3 py-2 text-sm text-green-700">{grandBuffer.toLocaleString()}</td>
              <td className="px-3 py-2 text-sm font-bold text-blue-800">{grandAU.toLocaleString()}</td>
              <td className="px-3 py-2 text-sm font-bold text-purple-800">{grandUK.toLocaleString()}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Container fractions near 0.5 are flagged — adjust total run to fill containers more evenly. &quot;Ctrs&quot; = how many 20ft containers each market&apos;s allocation occupies (by CBM).
      </p>
    </div>
  );
}
