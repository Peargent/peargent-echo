# Contributing to Peargent Echo

Thanks for your interest in contributing! This guide will help you get set up for local development.

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/peargent/peargent-echo.git
cd peargent-echo
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env.local
```

The example file already has `NEXT_PUBLIC_DEV_MODE=true` set, which is all you need for frontend-only development.

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) — you'll be redirected to the dashboard with mock data.

## Development Modes

| Mode | Who It's For | Setup Required |
|------|-------------|----------------|
| **Dev Mode** | Frontend / UI contributors | Just `.env.example` → `.env.local` |
| **Full-Stack** | Convex / backend contributors | Own Convex project + API keys |

### Frontend-Only (Dev Mode)

With `NEXT_PUBLIC_DEV_MODE=true`, the app:
- Bypasses all authentication
- Uses mock data for users, memories, analytics, API keys
- Shows a **⚡ DEV MODE** banner so you know it's active
- Lets you navigate all dashboard pages freely

This is perfect for working on:
- UI components and layouts
- CSS and styling  
- Page structure and navigation
- Responsive design

### Full-Stack Development

If you need to modify Convex functions, schema, or backend logic:

1. **Create a free Convex account** at [convex.dev](https://convex.dev)
2. **Initialize your own project:**

```bash
npx convex dev
```

This will prompt you to create a new project and automatically update your `.env.local` with your Convex URL.

3. **Keep `NEXT_PUBLIC_DEV_MODE=true`** in `.env.local` — this enables email/password login so you don't need to set up OAuth apps
4. **Sign up at `/signup`** — in dev mode, you'll see an email/password form instead of OAuth buttons. Create an account on your own Convex instance.
5. **Add API keys** to your `.env.local` as needed:
   - `COHERE_API_KEY` — for embeddings ([cohere.com](https://cohere.com))
   - Payment keys — only if working on billing

> **Note:** Each contributor gets their own isolated Convex instance, so you can't break production data. No OAuth setup is required — dev mode enables email/password auth automatically.

## Project Structure

```
├── convex/          # Convex backend functions & schema
├── public/          # Static assets
├── src/
│   ├── app/         # Next.js App Router pages
│   │   ├── dashboard/  # Main dashboard (overview, memories, keys, etc.)
│   │   ├── login/      # Login page
│   │   └── api/        # API routes (v1)
│   ├── components/  # Reusable React components
│   └── lib/         # Utilities (devMode.ts, convex client, etc.)
├── .env.example     # Template for contributors
└── CONTRIBUTING.md  # This file
```

## Submitting Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Test locally with both dev mode and (if applicable) your Convex instance
5. Open a pull request with a clear description

## Questions?

Open an issue on GitHub or reach out to the maintainers.
