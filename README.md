# Attendly Student Attendance

Attendly is an elegant React + TypeScript student attendance web app designed around the existing Supabase structure:

- `Students`: `uuid`, `name`, `roll_no`, `department`, `semester`, `created_at`
- `Courses`: `uuid`, `name`, `code`, `semester`, `created_at`
- `Attendance`: `id`, `student_id`, `course`, `date`, `status`

## Run locally

```bash
pnpm install
cp .env.example .env
# add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env
pnpm dev
```

The app automatically enters **demo mode** when the two public Supabase variables are missing. Demo data is stored in browser local storage, so the Preview supports student/course CRUD and attendance marking without credentials. Once the variables are present, the client reads and writes the Supabase tables directly. The browser must only receive the public anon key; never put the service-role key in `.env` or frontend code.

## Important schema note

The `Attendance.course` value is treated as the selected course UUID and is joined to `Courses.uuid` in the interface. Attendance marking looks for an existing row matching `student_id + course + date` before updating; otherwise it inserts a new row. For reliable production behavior, add foreign keys from `Attendance.student_id` to `Students.uuid` and `Attendance.course` to `Courses.uuid`, and consider a unique constraint on `(student_id, course, date)`.

## Quality checks

```bash
pnpm build
```

The app includes client-side required-field validation, duplicate roll/code checks, empty/loading/error states, responsive navigation, searchable/filterable tables, and a public `/manus-routes.json` route manifest.
