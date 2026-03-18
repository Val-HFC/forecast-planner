# Forecast Planner — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** Build a Next.js web app for AU + UK production forecasting with container optimisation, multi-market demand planning, and Excel/PDF export.

**Architecture:** Next.js 14 App Router, client-side calculations (no DB needed for MVP), ExcelJS for export, Recharts for visualisation, optional PostgreSQL for saving plans.

---

## Task 1: Scaffold + Data Models

- [x] `npx create-next-app@latest forecast-planner --typescript --tailwind --app`
- [x] Define TypeScript types:
  ```typescript
  type Product = {
    sku: string;
    name: string;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    weightKg: number;
    unitsPerCarton: number;
    cbmPerCarton: number; // calculated
  }
  type MarketForecast = {
    market: 'AU' | 'UK';
    skuId: string;
    currentMonthlySales: number;
    growthRate: number; // percentage
    safetyStockPct: number;
    leadTimeDays: number;
    forecastedQty: number; // calculated
  }
  type ContainerPlan = {
    products: { sku: string; qty: number; }[];
    totalCBM: number;
    fillPct: number;
    totalWeight: number;
  }
  ```
- [x] Commit: `feat: scaffold + types`

---

## Task 2: Product Input UI

- [x] `app/products/page.tsx` — data entry table for SKUs
- [x] Auto-calculate CBM per carton from dimensions
- [x] Import from CSV button
- [x] Export products to CSV
- [x] Commit: `feat: product data entry`

---

## Task 3: Demand Forecast

- [x] `app/forecast/page.tsx` — per market, per SKU
- [x] Inputs: current monthly sales, growth %, safety stock %, lead time
- [x] Calculation:
  ```
  monthly_needed = current_monthly * (1 + growth_rate)
  quarterly_needed = monthly_needed * 3
  with_safety = quarterly_needed * (1 + safety_stock_pct)
  order_qty = ceil(with_safety)
  ```
- [x] Side-by-side AU vs UK view
- [x] Commit: `feat: demand forecast`

---

## Task 4: Container Optimiser

- [x] `app/container/page.tsx`
- [x] 20ft container specs: 33 CBM, 28,000 kg
- [x] For each SKU: calculate cartons needed, CBM used, weight
- [x] Sort by priority, fill container to 95%+ target
- [x] Display: visual fill bar, CBM remaining, weight remaining
- [x] Suggest add-ons if space remains
- [x] Commit: `feat: container optimiser`

---

## Task 5: Production Split

- [x] `app/production/page.tsx`
- [x] Input: total production run (combined)
- [x] Auto-split based on AU demand + UK demand proportions
- [x] Show: AU allocation, UK allocation, buffer
- [x] Flag if split doesn't fill containers evenly → suggest adjustment
- [x] Commit: `feat: production split calculator`

---

## Task 6: Charts + Visualisation

- [x] Recharts: bar chart of forecast by SKU by market
- [x] Line chart: projected demand over 12 months
- [x] Pie chart: container fill by product
- [x] Commit: `feat: charts`

---

## Task 7: Export

- [x] Excel export: `ExcelJS` — separate sheets for AU, UK, Container Plan
- [x] PDF export: `jsPDF` — formatted report with logo
- [x] Commit: `feat: Excel + PDF export`

---

## Task 8: Deploy

- [x] Push to GitHub repo `forecast-planner`
- [x] Deploy to Vercel
- [x] Share URL with team
- [x] Commit: `feat: production deployment`
