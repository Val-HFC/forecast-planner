# Forecast Planner — Handoff Notes

## Last Completed Task
**Task 3: Demand Forecast** ✅

- `app/forecast/ForecastClient.tsx` — per-SKU per-market demand forecast
- Formula: monthly_needed = current * (1 + growth%); quarterly * (1 + safety%) → ceil
- Side-by-side AU vs UK view with totals
- All inputs editable inline, auto-save to localStorage

## Next Task
**Task 4: Container Optimiser** — `app/container/page.tsx` fill 20ft container, visual fill bar, add-on suggestions

## Status
- [x] Task 1: Scaffold + Data Models
- [x] Task 2: Product Input UI
- [x] Task 3: Demand Forecast
- [ ] Task 3: Demand Forecast
- [ ] Task 4: Container Optimiser
- [ ] Task 5: Production Split
- [ ] Task 6: Charts + Visualisation
- [ ] Task 7: Export
- [ ] Task 8: Deploy
