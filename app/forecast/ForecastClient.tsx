"use client";

import { useState, useEffect } from "react";
import type { Product, MarketForecast } from "../types";

const PRODUCTS_KEY = "forecast_products";
const FORECAST_KEY = "forecast_market_data";

type ForecastInput = {
  skuId: string;
  currentMonthlySales: number;
  growthRate: number;
  safetyStockPct: number;
  leadTimeDays: number;
};

type MarketInputs = {
  AU: Record<string, ForecastInput>;
  UK: Record<string, ForecastInput>;
};

function calcForecast(input: ForecastInput): MarketForecast & { monthlyNeeded: number; quarterlyNeeded: number } {
  const monthlyNeeded = input.currentMonthlySales * (1 + input.growthRate / 100);
  const quarterlyNeeded = monthlyNeeded * 3;
  const withSafety = quarterlyNeeded * (1 + input.safetyStockPct / 100);
  const forecastedQty = Math.ceil(withSafety);
  return {
    market: "AU",
    skuId: input.skuId,
    currentMonthlySales: input.currentMonthlySales,
    growthRate: input.growthRate,
    safetyStockPct: input.safetyStockPct,
    leadTimeDays: input.leadTimeDays,
    forecastedQty,
    monthlyNeeded: Math.round(monthlyNeeded),
    quarterlyNeeded: Math.round(quarterlyNeeded),
  };
}

function defaultInput(skuId: string): ForecastInput {
  return { skuId, currentMonthlySales: 0, growthRate: 0, safetyStockPct: 15, leadTimeDays: 30 };
}

export default function ForecastClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inputs, setInputs] = useState<MarketInputs>({ AU: {}, UK: {} });

  useEffect(() => {
    const prods: Product[] = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]");
    setProducts(prods);

    const saved: MarketInputs = JSON.parse(localStorage.getItem(FORECAST_KEY) || "null") || { AU: {}, UK: {} };
    // Ensure all products have entries
    const merged: MarketInputs = { AU: { ...saved.AU }, UK: { ...saved.UK } };
    for (const p of prods) {
      if (!merged.AU[p.sku]) merged.AU[p.sku] = defaultInput(p.sku);
      if (!merged.UK[p.sku]) merged.UK[p.sku] = defaultInput(p.sku);
    }
    setInputs(merged);
  }, []);

  function updateInput(market: "AU" | "UK", sku: string, field: keyof ForecastInput, value: number) {
    setInputs((prev) => {
      const updated = {
        ...prev,
        [market]: {
          ...prev[market],
          [sku]: { ...prev[market][sku], [field]: value },
        },
      };
      localStorage.setItem(FORECAST_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  if (products.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Demand Forecast</h1>
        <p className="text-gray-400 text-sm">No products found. <a href="/products" className="text-blue-600 underline">Add products first.</a></p>
      </div>
    );
  }

  const markets: ("AU" | "UK")[] = ["AU", "UK"];

  const totalByMarket = (market: "AU" | "UK") =>
    products.reduce((sum, p) => sum + (calcForecast(inputs[market][p.sku] || defaultInput(p.sku)).forecastedQty), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Demand Forecast</h1>
      <p className="text-gray-500 text-sm mb-6">Quarterly order quantities including growth and safety stock.</p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {markets.map((market) => (
          <div key={market} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className={`px-4 py-3 font-semibold text-sm ${market === "AU" ? "bg-blue-50 text-blue-800" : "bg-purple-50 text-purple-800"}`}>
              {market === "AU" ? "🇦🇺 Australia" : "🇬🇧 United Kingdom"}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-right">Monthly Sales</th>
                    <th className="px-3 py-2 text-right">Growth %</th>
                    <th className="px-3 py-2 text-right">Safety %</th>
                    <th className="px-3 py-2 text-right">Lead (days)</th>
                    <th className="px-3 py-2 text-right">Monthly Needed</th>
                    <th className="px-3 py-2 text-right">Qtr Needed</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700">Order Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => {
                    const inp = inputs[market][p.sku] || defaultInput(p.sku);
                    const result = calcForecast(inp);
                    return (
                      <tr key={p.sku} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={inp.currentMonthlySales || ""}
                            onChange={(e) => updateInput(market, p.sku, "currentMonthlySales", parseFloat(e.target.value) || 0)}
                            className="w-20 border border-gray-300 rounded px-1 py-0.5 text-right text-xs"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={inp.growthRate || ""}
                            onChange={(e) => updateInput(market, p.sku, "growthRate", parseFloat(e.target.value) || 0)}
                            className="w-16 border border-gray-300 rounded px-1 py-0.5 text-right text-xs"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={inp.safetyStockPct || ""}
                            onChange={(e) => updateInput(market, p.sku, "safetyStockPct", parseFloat(e.target.value) || 0)}
                            className="w-16 border border-gray-300 rounded px-1 py-0.5 text-right text-xs"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={inp.leadTimeDays || ""}
                            onChange={(e) => updateInput(market, p.sku, "leadTimeDays", parseFloat(e.target.value) || 0)}
                            className="w-16 border border-gray-300 rounded px-1 py-0.5 text-right text-xs"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-gray-500">{result.monthlyNeeded.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{result.quarterlyNeeded.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-semibold">{result.forecastedQty.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={7} className="px-3 py-2 text-sm font-medium text-gray-600">Total Order Qty</td>
                    <td className="px-3 py-2 text-right text-sm font-bold">{totalByMarket(market).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
