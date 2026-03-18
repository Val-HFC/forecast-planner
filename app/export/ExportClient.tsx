"use client";

import { useEffect, useState } from "react";
import type { Product } from "../types";

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
  return Math.ceil(quarterly * (1 + inp.safetyStockPct / 100));
}

function cartonsNeeded(units: number, unitsPerCarton: number): number {
  return Math.ceil(units / unitsPerCarton);
}

const defaults: ForecastInput = { currentMonthlySales: 0, growthRate: 0, safetyStockPct: 15, leadTimeDays: 30 };

export default function ExportClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setProducts(JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]"));
  }, []);

  function getData() {
    const forecasts: Record<string, Record<string, ForecastInput>> = JSON.parse(localStorage.getItem(FORECAST_KEY) || "null") || { AU: {}, UK: {} };
    const containerQtys: Record<string, number> = JSON.parse(localStorage.getItem(CONTAINER_KEY) || "null") || {};
    return { forecasts, containerQtys };
  }

  async function exportExcel() {
    setStatus("Generating Excel...");
    const ExcelJS = (await import("exceljs")).default;
    const { forecasts, containerQtys } = getData();
    const wb = new ExcelJS.Workbook();
    wb.creator = "Forecast Planner";
    wb.created = new Date();

    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF2563EB" } },
      alignment: { horizontal: "center" as const },
    };

    for (const market of ["AU", "UK"] as const) {
      const ws = wb.addWorksheet(`Forecast ${market}`);
      ws.columns = [
        { header: "SKU", key: "sku", width: 14 },
        { header: "Name", key: "name", width: 24 },
        { header: "Monthly Sales", key: "monthly", width: 16 },
        { header: "Growth %", key: "growth", width: 12 },
        { header: "Safety %", key: "safety", width: 12 },
        { header: "Lead Days", key: "lead", width: 12 },
        { header: "Monthly Needed", key: "monthlyNeeded", width: 16 },
        { header: "Qtr Needed", key: "qtr", width: 14 },
        { header: "Order Qty", key: "order", width: 12 },
      ];
      ws.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
      for (const p of products) {
        const inp = forecasts[market]?.[p.sku] || defaults;
        const monthly = inp.currentMonthlySales * (1 + inp.growthRate / 100);
        const qtr = monthly * 3;
        const order = Math.ceil(qtr * (1 + inp.safetyStockPct / 100));
        ws.addRow({
          sku: p.sku, name: p.name, monthly: inp.currentMonthlySales,
          growth: inp.growthRate, safety: inp.safetyStockPct, lead: inp.leadTimeDays,
          monthlyNeeded: Math.round(monthly), qtr: Math.round(qtr), order,
        });
      }
    }

    // Container Plan sheet
    const cs = wb.addWorksheet("Container Plan");
    cs.columns = [
      { header: "SKU", key: "sku", width: 14 },
      { header: "Name", key: "name", width: 24 },
      { header: "Order Qty", key: "qty", width: 12 },
      { header: "Cartons", key: "cartons", width: 10 },
      { header: "CBM Used", key: "cbm", width: 12 },
      { header: "Weight (kg)", key: "weight", width: 14 },
      { header: "Fill %", key: "fill", width: 10 },
    ];
    cs.getRow(1).eachCell((cell) => Object.assign(cell, headerStyle));
    let totalCBM = 0;
    let totalWeight = 0;
    for (const p of products) {
      const qty = containerQtys[p.sku] ?? calcForecasted(forecasts.AU?.[p.sku] || defaults);
      const cartons = cartonsNeeded(qty, p.unitsPerCarton);
      const cbm = cartons * p.cbmPerCarton;
      const weight = cartons * p.weightKg;
      totalCBM += cbm;
      totalWeight += weight;
      cs.addRow({ sku: p.sku, name: p.name, qty, cartons, cbm: cbm.toFixed(3), weight: weight.toFixed(1), fill: `${((cbm / 33) * 100).toFixed(1)}%` });
    }
    cs.addRow({});
    const totalRow = cs.addRow({ sku: "TOTAL", cbm: totalCBM.toFixed(3), weight: totalWeight.toFixed(1), fill: `${((totalCBM / 33) * 100).toFixed(1)}%` });
    totalRow.font = { bold: true };

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const quarter = `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
    a.href = url;
    a.download = `container_plan_${quarter}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Excel exported.");
  }

  async function exportPDF() {
    setStatus("Generating PDF...");
    const { jsPDF } = await import("jspdf");
    const { forecasts, containerQtys } = getData();
    const doc = new jsPDF();
    const quarter = `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Forecast Planner — Production Report", 14, 10);
    doc.setFontSize(9);
    doc.text(quarter, pageWidth - 14, 10, { align: "right" });
    doc.setTextColor(0, 0, 0);
    y = 24;

    for (const market of ["AU", "UK"] as const) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${market === "AU" ? "Australia" : "United Kingdom"} — Quarterly Forecast`, 14, y);
      y += 6;

      // Table header
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(239, 246, 255);
      doc.rect(14, y, pageWidth - 28, 6, "F");
      const cols = [14, 45, 75, 100, 120, 145, 170];
      const headers = ["SKU", "Name", "Monthly", "Growth%", "Safety%", "Qtr Needed", "Order Qty"];
      headers.forEach((h, i) => doc.text(h, cols[i], y + 4));
      y += 8;

      doc.setFont("helvetica", "normal");
      for (const p of products) {
        const inp = forecasts[market]?.[p.sku] || defaults;
        const monthly = inp.currentMonthlySales * (1 + inp.growthRate / 100);
        const qtr = monthly * 3;
        const order = Math.ceil(qtr * (1 + inp.safetyStockPct / 100));
        const row = [p.sku, p.name.substring(0, 18), inp.currentMonthlySales.toString(), `${inp.growthRate}%`, `${inp.safetyStockPct}%`, Math.round(qtr).toString(), order.toString()];
        row.forEach((v, i) => doc.text(v, cols[i], y + 4));
        y += 6;
        if (y > 270) { doc.addPage(); y = 20; }
      }
      y += 8;
    }

    // Container Plan
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Container Plan (20ft)", 14, y);
    y += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(239, 246, 255);
    doc.rect(14, y, pageWidth - 28, 6, "F");
    const ccols = [14, 45, 90, 110, 130, 155];
    ["SKU", "Name", "Qty", "Cartons", "CBM", "Weight (kg)"].forEach((h, i) => doc.text(h, ccols[i], y + 4));
    y += 8;
    doc.setFont("helvetica", "normal");
    let totalCBM = 0;
    for (const p of products) {
      const qty = containerQtys[p.sku] ?? calcForecasted(forecasts.AU?.[p.sku] || defaults);
      const cartons = cartonsNeeded(qty, p.unitsPerCarton);
      const cbm = cartons * p.cbmPerCarton;
      totalCBM += cbm;
      const row = [p.sku, p.name.substring(0, 22), qty.toString(), cartons.toString(), cbm.toFixed(3), (cartons * p.weightKg).toFixed(1)];
      row.forEach((v, i) => doc.text(v, ccols[i], y + 4));
      y += 6;
      if (y > 270) { doc.addPage(); y = 20; }
    }
    doc.setFont("helvetica", "bold");
    doc.text(`Total CBM: ${totalCBM.toFixed(2)} / 33.00 (${((totalCBM / 33) * 100).toFixed(1)}% fill)`, 14, y + 6);

    doc.save(`forecast_report_${quarter}.pdf`);
    setStatus("PDF exported.");
  }

  if (products.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Export</h1>
        <p className="text-gray-400 text-sm">No products found. <a href="/products" className="text-blue-600 underline">Add products first.</a></p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Export</h1>
      <p className="text-gray-500 text-sm mb-6">Download your forecast and container plan as Excel or PDF.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        <button
          onClick={exportExcel}
          className="bg-white border-2 border-green-400 rounded-lg p-5 hover:bg-green-50 text-left transition"
        >
          <div className="text-2xl mb-2">📊</div>
          <div className="font-semibold text-gray-800 mb-1">Export Excel</div>
          <div className="text-xs text-gray-500">Separate sheets for AU, UK, and Container Plan</div>
        </button>
        <button
          onClick={exportPDF}
          className="bg-white border-2 border-red-300 rounded-lg p-5 hover:bg-red-50 text-left transition"
        >
          <div className="text-2xl mb-2">📄</div>
          <div className="font-semibold text-gray-800 mb-1">Export PDF</div>
          <div className="text-xs text-gray-500">Formatted report with all markets and container plan</div>
        </button>
      </div>

      {status && (
        <p className="mt-4 text-sm text-green-600">{status}</p>
      )}

      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-1">What&apos;s included:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>AU Forecast sheet — per SKU quarterly order quantities</li>
          <li>UK Forecast sheet — per SKU quarterly order quantities</li>
          <li>Container Plan sheet — cartons, CBM, weight, fill %</li>
          <li>PDF report — all markets + container summary</li>
        </ul>
      </div>
    </div>
  );
}
