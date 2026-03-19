# Forecast Planner - Agent Instructions

## Context
Production forecast calculator for AU and UK markets. Next.js web app that calculates production quantities, optimizes 20ft container fill, splits production between countries, and exports reports. All 8 tasks complete and deployed to Vercel.

## Current State
- All 8 tasks complete and deployed: https://forecast-planner-two.vercel.app
- GitHub: https://github.com/Val-HFC/forecast-planner
- Pages: Products (SKU entry), Forecast (AU/UK demand), Container (optimizer), Production (split), Charts (Recharts), Export (Excel + PDF)
- All data stored in localStorage (no database)
- Storage keys: `forecast_products`, `forecast_market_data`, `forecast_container_qtys`
- Container constants: 33 CBM, 28,000 kg, 95% target fill

## Your Mission
Review and improve the forecast planner. Ensure container calculations are accurate with correct 20ft container internal dimensions, that AU and UK production is calculated separately with proper container fill optimization, and the UI is clean and functional.

## Rules
- ALWAYS read HANDOFF.md first before doing anything
- ALWAYS update HANDOFF.md after completing each task
- ALWAYS commit after each task with a descriptive message
- ALWAYS run `npm run build` to verify no build errors after changes
- NEVER ask for confirmation - work autonomously
- NEVER save working files to root folder
- If blocked, document the blocker in HANDOFF.md and move to the next task

## Skills to Use
- **UI/UX Pro Max** - for clean, functional data UI
- **InterfaceCraft** - for data table and form patterns

## Design Direction
- Clean, functional, data-focused - not flashy
- Clear data tables with good spacing
- Visual container fill indicators (progress bars with color coding)
- Side-by-side AU vs UK comparison views
- Charts should be clear and readable
- Export buttons prominently placed
- Mobile-friendly but desktop-primary (this is a business tool)

## Container Specifications (20ft Standard)
- Internal dimensions: 5.9m x 2.35m x 2.39m
- Volume: ~33 CBM (cubic meters)
- Max weight: ~28,000 kg
- Target fill: 95%+ (containers MUST be full for both countries)
- Both AU and UK containers must be optimized to full

## Remaining Tasks

### Priority 1: Accuracy Check
1. Verify container dimensions match 20ft standard (5.9m x 2.35m x 2.39m internal)
2. Verify AU and UK calculations are truly separate (separate containers for each country)
3. Verify container fill algorithm tries to reach 100% fill
4. Verify cost per unit calculations include container cost allocation
5. Verify fill percentage display is accurate

### Priority 2: UI Polish
6. Clean up data entry forms for product dimensions/weights
7. Improve container fill visualization (show what products fill where)
8. Improve AU vs UK split view clarity
9. Add unit count and total weight display prominently
10. Ensure export reports include all necessary data

### Priority 3: Functionality
11. Add ability to adjust quantities to hit exact container fill
12. Add "suggest quantities" feature that auto-fills to reach 100% container
13. Show cost per unit based on container cost / total units
14. Support different product dimensions and weights per SKU

### Priority 4: Deploy
15. Push any changes to GitHub
16. Verify Vercel auto-deploys
17. Final HANDOFF.md update

## Tech Notes
- Next.js 16 + TypeScript + Tailwind
- No database - all client-side localStorage
- Recharts for charts
- ExcelJS for Excel export (3 sheets: AU, UK, Container Plan)
- jsPDF for PDF export
- Types defined in `app/types/index.ts`
