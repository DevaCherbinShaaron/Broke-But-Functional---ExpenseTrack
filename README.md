# Broke But Functional — Survive the Month

A lightweight personal finance app starter for planning how to make ₹10,000 last
30 days. Built with React, TypeScript, Vite, and Tailwind CSS.

## Getting started

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

## Checks and production build

```sh
npm run test
npm run lint
npm run build
```

The production-ready static site is written to `dist/`, which can be deployed to
any static hosting provider that supports Vite.

## Planned project structure

- `src/components/` — shared interface components
- `src/features/` — dashboard and finance feature areas
- `src/lib/` — shared formatting and calculation helpers
- `src/test/` — shared test setup

The initial scaffold includes a responsive welcome screen, Indian rupee
formatting, and a component test. Feature folders will be added as those areas
are built in small, tested steps.
