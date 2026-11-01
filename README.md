# OpenTerminal V2

A clean frontend rebuild for OpenTerminal, inspired by OpenStock's component architecture and shadcn/ui design system.

## Stack
- Next.js 15 / React 19 / TypeScript
- Tailwind CSS 4 and shadcn/ui-style primitives (Radix UI)
- Lucide React icons
- Zustand and TanStack Query
- Lightweight Charts

## Development
```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL` to the existing OpenTerminal API origin when connecting the live backend. This repository contains frontend code only.

## Design reference
OpenStock (Open-Dev-Society/OpenStock) informed the app-shell, panel, bento, surface and component-system direction. This is an independent implementation; no OpenStock source files are copied.
