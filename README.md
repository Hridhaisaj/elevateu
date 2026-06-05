# ElevateU — LinkedIn for High Schoolers

A professional networking platform built for high school students to showcase their profiles, connect with peers, and discover local opportunities.

## Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (clean, professional — no heavy gradients or gimmicks)
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Data fetching**: TanStack Query
- **Routing**: React Router v6

## Features

- 🔐 Auth — sign up / sign in / onboarding flow
- 👤 Profiles — bio, experience, achievements, skills, GPA, school
- 📰 Feed — post updates, like, comment in real time
- 💼 Opportunities — browse/save internships, scholarships, programs
- 🤝 Network — send/accept connection requests
- 💬 Messages — real-time direct messaging
- 🔍 Search — find students and opportunities

## Getting started

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → New project.

### 2. Run the schema

In your Supabase project → **SQL Editor**, paste the contents of `supabase/schema.sql` and run it.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in your Supabase project URL and anon key from **Project Settings → API**.

### 4. Install dependencies and start

```bash
npm install
npm run dev
```

## Project structure

```
src/
├── components/
│   ├── layout/     # Topbar, Sidebar, AppLayout
│   ├── ui/         # Avatar, Badge, EmptyState
│   ├── feed/       # Post-related components
│   ├── profile/    # Profile section components
│   └── opportunities/
├── hooks/
│   └── useAuth.ts  # Auth context + hook
├── lib/
│   ├── supabase.ts
│   └── utils.ts
├── pages/          # One file per route
└── types/
    └── database.ts # Full Supabase type definitions
```
