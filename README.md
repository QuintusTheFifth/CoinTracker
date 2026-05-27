# CoinTracker

**A clean, modern cryptocurrency portfolio tracker** — see what you hold, what it's worth, and how it's performing, at a glance.

[![Angular](https://img.shields.io/badge/Angular-9-dd0031?logo=angular)](https://angular.io)
[![Firebase](https://img.shields.io/badge/Firebase-Hosting-ffca28?logo=firebase)](https://firebase.google.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Overview

CoinTracker is a dark‑minimal portfolio dashboard for crypto. It pulls live prices and market data from CoinGecko, stores your transactions in Firebase, and presents everything in a restrained, focused interface — a single accent colour, a proper numeric ledger, and calm, purposeful charts.

The UI follows a flat, Linear/Vercel‑style design system: layered surfaces with hairline borders (no glass or heavy shadows), [Inter](https://rsms.me/inter/) for text, tabular figures for every number, and a single Bitcoin‑orange accent used sparingly. A light theme is included; dark is the default.

## Features

- **Portfolio at a glance** — total value, value‑weighted **24h change**, and **all‑time return** (current value vs. cost basis), side by side.
- **Per‑coin holdings** — drill into any asset to see your holding value, amount held, and full transaction history.
- **Live prices & market data** — via the CoinGecko API, with a static fallback so the app stays usable if the API is unavailable.
- **Trend‑coloured sparklines** — 7‑day mini‑charts coloured green/red by direction; full labelled price charts on the detail view (3m / 9m / 1y / all‑time).
- **Proper financial ledger** — right‑aligned, tabular numerals; directional ▲/▼ cues (not colour alone).
- **Sign in with Google or MetaMask** — sign‑in is required to view your portfolio, which is saved to your account (`users/{uid}` in Firestore).
- **Demo mode** — choose **Explore the demo** on the sign‑in screen to browse a seeded sample portfolio (stored locally), no account required.
- **EUR / USD** toggle, sortable + paginated table, and exchange filtering.
- **Responsive** — adaptive columns, mobile stat stacking, and a floating add button on small screens.
- **Accessible** — WCAG‑AA contrast, visible focus states, ARIA labels, and reduced‑motion support.
- **Dark & light themes** — with a one‑click toggle.

## Live Demo

[https://cointracker-26919.web.app](https://cointracker-26919.web.app)

> Tip: click **Explore the demo** on the sign‑in screen to browse a populated sample portfolio right away — no account needed.

## Screenshots

### Portfolio dashboard
![Portfolio dashboard: portfolio value, 24h change and all-time return, with a right-aligned ledger of coins and trend-coloured 7-day sparklines](screenshots/portfolio-dashboard.png)

*Portfolio value, value‑weighted 24h change and all‑time return up top; a clean ledger below with live prices, 24h change, trend‑coloured sparklines and per‑coin totals.*

### Coin detail
![Coin detail: BTC holdings, a one-year price chart with labelled axes, and the transaction history](screenshots/coin-detail.png)

*Your holdings for the asset, a labelled price chart (3m / 9m / 1y / all), and the full transaction history with exchange filtering.*

### Add to portfolio
![Add to portfolio dialog with coin autocomplete, amount, price bought, date and exchange fields](screenshots/add-coin.png)

*A focused dialog: coin autocomplete, amount, price bought, date and exchange.*

### Sign in
![Sign-in screen with Google and MetaMask options](screenshots/login.png)

*Sign in with Google or connect a wallet — no card required.*

### 404
![Not-found page with a link back to the portfolio](screenshots/404.png)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Angular 9, Angular Material |
| **Charts** | Chart.js (theme‑aware, trend‑coloured) |
| **Backend** | Firebase (Firestore, Auth, Hosting) |
| **Market data** | CoinGecko API (prices, images, history) |
| **Auth** | Google Sign‑In, MetaMask wallet |
| **Styling** | CSS custom properties (design tokens), Inter, Bootstrap grid |
| **Tooling** | Node 16, Angular CLI 9 |

## Development

### Prerequisites
- **Node.js 16.x** — required. The Angular 9 / webpack 4 toolchain does **not** run on Node 17+. Use [nvm](https://github.com/nvm-sh/nvm): `nvm install 16 && nvm use 16`.
- Angular CLI 9.x
- (Optional) A Firebase project, for real auth + persistence.

### Setup

```bash
# Clone
git clone https://github.com/QuintusTheFifth/CoinTracker.git
cd CoinTracker

# Use Node 16
nvm use 16

# Install dependencies
npm install --legacy-peer-deps

# Run the dev server
ng serve --proxy-config proxy.conf.json
# open http://localhost:4200
```

To explore without configuring Firebase, open the app and click **Explore the demo** on the sign‑in screen. Demo data is stored locally in your browser, and add/edit/delete update the view live. Signing in with Google or a wallet instead gives you your own portfolio, persisted per account in Firestore.

```bash
# Production build
ng build --prod
```

### Deploy to Firebase

```bash
# Local deploy (requires `firebase login`)
./deploy.sh
```

### CI/CD

A GitHub Actions workflow (`.github/workflows/firebase-deploy.yml`) installs dependencies, builds with `ng build --prod`, and deploys to Firebase Hosting. Enable it by adding one of these repository secrets:

- `FIREBASE_TOKEN` — from `firebase login:ci`
- `FIREBASE_SERVICE_ACCOUNT` — service‑account JSON key (recommended)

---

*Built with Angular & Firebase.*
