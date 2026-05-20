# Newsmuncher

A mobile-first news and finance reading experience built with React, TypeScript, and Vite.

**Live demo:** https://meera19b.github.io/Newsmuncher/

## Highlights

- Home, For You, Categories, Insights, and Profile tabs with theming and brand variants
- Finance section with its own 5-tab navigation (Home, Lists, Search, Props, Learn)
- Fullscreen stock detail screen with sticky section tabs, scroll-synced active state, and horizontally scrollable financial tables (Overview, Chart, Analysis, Peers, Quarters, P&L, Balance, Cash Flow, Ratios, Investors, Documents)
- Interactive stock price chart with 1D / 1W / 1M / 6M / YTD / 1Y / 5Y timeframes and hover crosshair
- Watchlists, instrument search with recents, screening tools (RSI, MACD, Magic Formula, Piotroski, etc.), and a Learn tab with curated roadmaps

## Local development

```bash
yarn install
yarn dev
```

Then open the URL printed by Vite (typically http://localhost:5173/Newsmuncher/).

## Scripts

- `yarn dev` — start the local dev server
- `yarn build` — type-check and produce a production build in `dist/`
- `yarn preview` — preview the production build locally

## Deployment

Pushes to `main` trigger [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds the project and publishes `dist/` to GitHub Pages.
