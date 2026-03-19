# Forecast Planner — Handoff Notes

## COMPLETE

All 8 original tasks implemented and deployed. Polish pass completed 2026-03-19.

---

## Live URL

**https://forecast-planner-two.vercel.app**

GitHub: https://github.com/Val-HFC/forecast-planner

---

## What Was Built

| Task | Status | Summary |
|------|--------|---------|
| 1. Scaffold + Types | Done | Next.js 16 + TypeScript + Tailwind; types in `app/types/index.ts` |
| 2. Product Input UI | Done | `app/products/` — SKU table, CBM auto-calc, CSV import/export |
| 3. Demand Forecast | Done | `app/forecast/` — side-by-side AU/UK quarterly forecast |
| 4. Container Optimiser | Done | `app/container/` — dual AU/UK panels, orientation optimization, cost calc |
| 5. Production Split | Done | `app/production/` — AU/UK split with buffer %, container flags |
| 6. Charts | Done | `app/charts/` — bar, line, pie via Recharts |
| 7. Export | Done | `app/export/` — Excel (3 sheets) + PDF via ExcelJS + jsPDF |
| 8. Deploy | Done | GitHub + Vercel production deployment |

## Polish Pass (2026-03-19)

### Container Optimiser Overhaul
- **Separate AU and UK panels**: Each country now has its own container calculation panel with independent quantity inputs
- **Orientation optimization**: All 6 orientations tested per carton, best fit displayed (along L, W, H axes)
- **Correct container dimensions**: 5.9m x 2.35m x 2.39m = 33.2 CBM (was 33)
- **Visual container fill diagram**: 3D-ish fill visualization with volume percentage, weight bar, and 95% target line
- **Auto-fill to 100%**: Button to automatically suggest quantities that fill the container completely
- **Cost calculations**: Manufacturing cost per unit, shipping cost per container (AU/UK separate), total landed cost, cost per unit breakdown
- **Container status**: FULL indicator when target fill achieved, over-capacity warning

### UI Improvements
- Apple-level clean design: rounded-2xl cards, subtle shadows, tracking-tight typography
- Sticky frosted-glass navigation bar with backdrop blur
- Refined color palette using Apple's gray tones (#f5f5f7 background)
- Improved input focus states and hover transitions
- Responsive grid layout for all pages

### Technical
- `getBestOrientation()` function in types for 6-orientation carton fitting
- `CostInputs` type for cost parameters, persisted in localStorage
- Container quantities now stored per-market: `{ AU: {...}, UK: {...} }`
- localStorage key `forecast_cost_inputs` for cost parameters

## Architecture Notes

- **No database** — all data stored in `localStorage` (client-side)
- **Data flow**: Products -> Forecast -> Container/Production/Charts/Export
- **Storage keys**: `forecast_products`, `forecast_market_data`, `forecast_container_qtys`, `forecast_cost_inputs`
- **Container constants**: 33.2 CBM, 28,000 kg, 95% target fill (in `app/types/index.ts`)
