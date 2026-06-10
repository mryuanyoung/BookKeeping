# BookKeeping Native Android

This directory contains a native Android rewrite of the original React/Vite bookkeeping app.

## Feature Mapping

- Record income and expense bills.
- Edit and delete bills from daily lists.
- View day, month, year, and total summaries.
- Show category totals for simple chart-style statistics.
- Import and export the same JSON shape used by the web app: `importBill` and `exportBill`.
- Salary, Chengdu housing fund, and estate loan calculators.

## Architecture

- `data/`: domain models, SQLite persistence, JSON backup.
- `calc/`: calculator business logic ported from the web project.
- `MainActivity.kt`: native Android View UI and navigation.

The implementation intentionally uses Android SDK primitives plus Kotlin, so the native port stays easy to inspect and does not depend on a heavy UI framework.
