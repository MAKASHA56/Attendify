# Attendly Student Attendance — Implementation Plan

## Product scope

Attendly is an elegant student attendance web app backed by the existing Supabase tables `Students`, `Courses`, and `Attendance`. The app covers the requested dashboard, student and course CRUD, daily Present/Absent marking, saved attendance records, search/filter workflows, loading/error states, validation, testing, and GitHub connection.

## Design direction: Porcelain Ledger

- **Design movement:** editorial academic interface / modern ledger design.
- **Core principles:** warm and trustworthy surfaces; ink-blue structure with brass moments; fine rules and compact data displays; calm hierarchy over generic admin density.
- **Color philosophy:** warm ivory keeps the workspace human and paper-like; ink navy carries authority and legibility; brass highlights key actions and attendance signals like a stamped ledger; muted blue-gray supports quiet secondary data.
- **Layout paradigm:** an asymmetrical fixed navigation rail paired with an editorial content canvas. The dashboard opens with a wide narrative header and then moves through a split ledger of metrics, trend bars, and recent activity rather than a centered grid of identical cards.
- **Signature elements:** a brass-edged monogram seal; hairline navy rules; small uppercase ledger labels and compact status pills.
- **Interaction philosophy:** direct, reassuring, and reversible. Forms stay close to the table they change, primary actions use a single clear brass CTA, and saves surface an understated toast instead of interrupting the workflow.
- **Animation:** short 160–220ms ease-out fades and rises for panels, 250ms status color transitions, and subtle progress-bar growth on dashboard trends. No looping or distracting motion.
- **Typography system:** Literata for display headings and data stories; Manrope for navigation, labels, controls, and dense table content. Headings use restrained editorial casing; labels use small tracked uppercase.
- **Brand essence:** a quiet attendance ledger for academic teams who need clarity at the start and end of every class day. Personality: **measured, observant, dependable**.
- **Brand voice:** headlines are concise and composed; actions are specific and reassuring. Example lines: “A clearer view of the week.” / “Record the room, then move on.”
- **Wordmark & logo:** Attendly uses an `A` monogram nested inside a rounded ledger seal, paired with a small brass baseline rule and the wordmark.
- **Signature brand color:** Ink Navy `#183153`.

## Implementation approach

- Use a Vite + React + TypeScript single-page application with a small view router held in React state (`Dashboard`, `Students`, `Courses`, `Attendance`).
- Use `@supabase/supabase-js` in `src/lib/supabase.ts`, configured by `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The data layer uses the user's exact table and column names and keeps Supabase access behind `src/lib/data.ts`.
- Include a local demo mode when Supabase environment variables are absent. Demo mode is persisted to `localStorage` so the Preview is fully interactive without inventing credentials; the UI labels this mode clearly.
- Keep feature-specific views in `src/components.tsx` and shared domain types/utilities in `src/lib/data.ts`. The app loads all three resources together, then performs CRUD operations through one mutation path so refresh and error handling stay consistent.
- Use a public route manifest at `/manus-routes.json` for the single-page route. Use an app config with a durable logo URL for checkpoint metadata.
- The project is a frontend-only Supabase client app; no private service-role key is ever shipped to the browser. A `.env.example` and README document the required public Supabase values and the expected schema behavior.

## Project structure

```text
attendly/
├── public/manus-routes.json   # Preview/published route declaration
├── src/
│   ├── components.tsx         # App shell, dashboard, CRUD views, forms, dialogs
│   ├── lib/data.ts            # Types, demo data, Supabase CRUD and selectors
│   ├── lib/supabase.ts        # Browser-safe Supabase client
│   ├── main.tsx               # React entry point
│   └── styles.css             # Porcelain Ledger design system and responsive layout
├── app.config.ts              # Project logo metadata
├── index.html                 # Vite HTML shell and font imports
├── package.json               # Pinned runtime/build dependencies
├── tsconfig.json              # TypeScript settings
├── vite.config.ts             # Vite/React configuration
├── .env.example               # Required public Supabase environment variables
└── README.md                  # Setup, schema, and test notes
```

## Data behavior

- Students use `uuid`, `name`, `roll_no`, `department`, `semester`, and optional `created_at`.
- Courses use `uuid`, `name`, `code`, `semester`, and optional `created_at`.
- Attendance uses `id`, `student_id`, `course`, `date`, and `status`. The `course` value stores the selected course UUID and is resolved to a course name in the interface.
- Attendance marking updates an existing same-student/course/date row when present and inserts otherwise, preventing duplicate daily records even though the supplied schema only names `id` as the primary identifier.
- Delete operations are explicit and the UI confirms before removing records.
