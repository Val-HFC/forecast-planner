# Forecast Planner — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** Build a Next.js web app for AU + UK production forecasting with container optimisation, multi-market demand planning, and Excel/PDF export.

**Architecture:** Next.js 14 App Router, client-side calculations (no DB needed for MVP), ExcelJS for export, Recharts for visualisation, optional PostgreSQL for saving plans.

---

## Task 1: Scaffold + Data Models

- [ ] `npx create-next-app@latest forecast-planner --typescript --tailwind --app`
- [ ] Define TypeScript types:
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
- [ ] Commit: `feat: scaffold + types`

---

## Task 2: Product Input UI

- [ ] `app/products/page.tsx` — data entry table for SKUs
- [ ] Auto-calculate CBM per carton from dimensions
- [ ] Import from CSV button
- [ ] Export products to CSV
- [ ] Commit: `feat: product data entry`

---

## Task 3: Demand Forecast

- [ ] `app/forecast/page.tsx` — per market, per SKU
- [ ] Inputs: current monthly sales, growth %, safety stock %, lead time
- [ ] Calculation:
  ```
  monthly_needed = current_monthly * (1 + growth_rate)
  quarterly_needed = monthly_needed * 3
  with_safety = quarterly_needed * (1 + safety_stock_pct)
  order_qty = ceil(with_safety)
  ```
- [ ] Side-by-side AU vs UK view
- [ ] Commit: `feat: demand forecast`

---

## Task 4: Container Optimiser

- [ ] `app/container/page.tsx`
- [ ] 20ft container specs: 33 CBM, 28,000 kg
- [ ] For each SKU: calculate cartons needed, CBM used, weight
- [ ] Sort by priority, fill container to 95%+ target
- [ ] Display: visual fill bar, CBM remaining, weight remaining
- [ ] Suggest add-ons if space remains
- [ ] Commit: `feat: container optimiser`

---

## Task 5: Production Split

- [ ] `app/production/page.tsx`
- [ ] Input: total production run (combined)
- [ ] Auto-split based on AU demand + UK demand proportions
- [ ] Show: AU allocation, UK allocation, buffer
- [ ] Flag if split doesn't fill containers evenly → suggest adjustment
- [ ] Commit: `feat: production split calculator`

---

## Task 6: Charts + Visualisation

- [ ] Recharts: bar chart of forecast by SKU by market
- [ ] Line chart: projected demand over 12 months
- [ ] Pie chart: container fill by product
- [ ] Commit: `feat: charts`

---

## Task 7: Export

- [ ] Excel export: `ExcelJS` — separate sheets for AU, UK, Container Plan
- [ ] PDF export: `jsPDF` — formatted report with logo
- [ ] Commit: `feat: Excel + PDF export`

---

## Task 8: Deploy

- [ ] Push to GitHub repo `forecast-planner`
- [ ] Deploy to Vercel
- [ ] Share URL with team
- [ ] Commit: `feat: production deployment`
