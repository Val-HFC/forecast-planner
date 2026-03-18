# Forecast Planner — Project Context
> AU + UK Production Calculator | Container Optimization | Multi-Market

---

## Purpose
Calculate production requirements for both Australian and UK markets, optimise for full 20ft container loads, and generate detailed forecasts.

---

## Core Calculations

### Per Market (AU + UK)
- Units required per SKU per month
- Units required per SKU per quarter
- Units required per SKU per year
- Buffer stock percentage (e.g., 15% safety stock)
- Total units needed including buffer

### Container Optimisation
- 20ft container specs:
  - Volume: ~33 CBM (cubic meters)
  - Max weight: ~28,000 kg
  - Typical usage: 25-28 CBM (allow for packing)
- Per SKU: dimensions (L x W x H cm), weight (kg), units per carton, CBM per carton
- Calculate: how many units per 20ft container
- Goal: fill container as close to 100% as possible
- Output: recommended order quantity to fill container exactly

### Multi-Country Split
- Input: total production run
- Output: split between AU and UK orders
- Consider: lead times per country, safety stock per country, seasonal demand variation

---

## Features
1. **Product Database** — SKU, dimensions, weight, carton qty
2. **Demand Forecast Input** — historical sales + growth rate
3. **Container Calculator** — units per 20ft, fill percentage
4. **AU vs UK Split** — separate forecasts per country
5. **Export** — Excel/CSV + PDF report
6. **Scenario Planning** — adjust growth rate, compare scenarios

---

## Tech Stack
- **Build as:** Next.js web app (accessible anywhere) OR local Excel macro
- **Recommended:** Next.js with Vercel (shareable with team)
- **Charts:** Recharts or Chart.js
- **Export:** ExcelJS for Excel export, jsPDF for PDF

---

## Output Reports
1. `forecast_AU_YYYY-QQ.pdf` — AU quarterly forecast
2. `forecast_UK_YYYY-QQ.pdf` — UK quarterly forecast
3. `container_plan_YYYY-MM.xlsx` — container loading plan
4. `production_run_YYYY-MM.xlsx` — combined production order

---

## Input Data Required
- Historical sales data by SKU by country (last 12 months)
- Projected growth rate per country (%)
- Product dimensions + weights
- Lead times per country
- Safety stock percentage
- Container cost per 20ft (for ROI calculation)

---

## Status
- [ ] Requirements confirmed with team
- [ ] Product dimension data collected
- [ ] Historical sales data exported
- [ ] Web app scaffolded
- [ ] Container calculator built
- [ ] AU forecast module built
- [ ] UK forecast module built
- [ ] Container optimiser built
- [ ] Export functions built
- [ ] Deployed to Vercel
