"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell,
} from "recharts";
import type { Product } from "../types";
import { CONTAINER_20FT_CBM } from "../types";

const PRODUCTS_KEY = "forecast_products";
const FORECAST_KEY = "forecast_market_data";
const CONTAINER_KEY = "forecast_container_qtys";

type ForecastInput = {
  currentMonthlySales: number;
  growthRate: number;
  safetyStockPct: number;
  leadTimeDays: number;
};

function calcMonthly(inp: ForecastInput): number {
  return inp.currentMonthlySales * (1 + inp.growthRate / 100);
}

function calcForecasted(inp: ForecastInput): number {
  return Math.ceil(calcMonthly(inp) * 3 * (1 + inp.safetyStockPct / 100));
}

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#f97316", "#84cc16"];

export default function ChartsClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [forecasts, setForecasts] = useState<Record<string, Record<string, ForecastInput>>>({ AU: {}, UK: {} });
  const [containerQtys, setContainerQtys] = useState<Record<string, number>>({});

  useEffect(() => {
    const prods: Product[] = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]");
    setProducts(prods);
    const fc = JSON.parse(localStorage.getItem(FORECAST_KEY) || "null") || { AU: {}, UK: {} };
    setForecasts(fc);
    const cq = JSON.parse(localStorage.getItem(CONTAINER_KEY) || "null") || {};
    setContainerQtys(cq);
  }, []);

  const defaults: ForecastInput = { currentMonthlySales: 0, growthRate: 0, safetyStockPct: 15, leadTimeDays: 30 };

  // Bar chart: forecast by SKU by market
  const barData = products.map((p) => ({
    sku: p.sku,
    AU: calcForecasted(forecasts.AU?.[p.sku] || defaults),
    UK: calcForecasted(forecasts.UK?.[p.sku] || defaults),
  }));

  // Line chart: projected demand over 12 months per SKU (combined AU+UK)
  const lineData = Array.from({ length: 12 }, (_, i) => {
    const month = { month: `M${i + 1}` } as Record<string, string | number>;
    for (const p of products) {
      const auInp = forecasts.AU?.[p.sku] || defaults;
      const ukInp = forecasts.UK?.[p.sku] || defaults;
      const auMonthly = auInp.currentMonthlySales * Math.pow(1 + auInp.growthRate / 100 / 12, i);
      const ukMonthly = ukInp.currentMonthlySales * Math.pow(1 + ukInp.growthRate / 100 / 12, i);
      month[p.sku] = Math.round(auMonthly + ukMonthly);
    }
    return month;
  });

  // Pie chart: container fill by product (based on container qtys)
  const pieData = products.map((p) => {
    const qty = containerQtys[p.sku] ?? calcForecasted(forecasts.AU?.[p.sku] || defaults);
    const cartons = Math.ceil(qty / p.unitsPerCarton);
    const cbm = cartons * p.cbmPerCarton;
    return { name: p.sku, value: parseFloat(cbm.toFixed(3)) };
  }).filter((d) => d.value > 0);

  const totalContainerCBM = pieData.reduce((s, d) => s + d.value, 0);
  if (totalContainerCBM < CONTAINER_20FT_CBM) {
    pieData.push({ name: "Empty", value: parseFloat((CONTAINER_20FT_CBM - totalContainerCBM).toFixed(3)) });
  }

  if (products.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Charts</h1>
        <p className="text-gray-400 text-sm">No products found. <a href="/products" className="text-blue-600 underline">Add products first.</a></p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Charts & Visualisation</h1>

      {/* Bar Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-sm text-gray-700 mb-4">Quarterly Forecast by SKU & Market</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="sku" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="AU" fill="#3b82f6" name="AU" radius={[3, 3, 0, 0]} />
            <Bar dataKey="UK" fill="#8b5cf6" name="UK" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-sm text-gray-700 mb-4">Projected Monthly Demand (12 Months, All Markets Combined)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={lineData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {products.map((p, i) => (
              <Line
                key={p.sku}
                type="monotone"
                dataKey={p.sku}
                stroke={COLORS[i % COLORS.length]}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="font-semibold text-sm text-gray-700 mb-4">Container Fill by Product (CBM)</h2>
        <div className="flex items-center gap-8">
          <ResponsiveContainer width={280} height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={110}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={entry.name === "Empty" ? "#e5e7eb" : COLORS[i % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v} CBM`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2">
            {pieData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.name === "Empty" ? "#e5e7eb" : COLORS[i % COLORS.length] }}
                />
                <span className="text-gray-600">{entry.name}</span>
                <span className="text-gray-400">{entry.value} CBM</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
