# Forecast Planner — Handoff Notes

## Last Completed Task
**Task 1: Scaffold + Data Models** ✅

- Next.js 14 app scaffolded with TypeScript, Tailwind, App Router
- TypeScript types defined in `app/types/index.ts`:
  - `Product` — SKU dimensions, weight, carton info
  - `MarketForecast` — per-market demand inputs + calculated qty
  - `ContainerPlan` — container loading summary
  - `ProductionSplit` — AU/UK allocation breakdown
- Container constants: 33 CBM, 28,000 kg, 95% fill target

## Next Task
**Task 2: Product Input UI** — `app/products/page.tsx` data entry table, CBM auto-calc, CSV import/export

## Status
- [x] Task 1: Scaffold + Data Models
- [ ] Task 2: Product Input UI
- [ ] Task 3: Demand Forecast
- [ ] Task 4: Container Optimiser
- [ ] Task 5: Production Split
- [ ] Task 6: Charts + Visualisation
- [ ] Task 7: Export
- [ ] Task 8: Deploy
