# Attendly delivery outcomes

- [ ] **Connect Supabase to the frontend** — Use the existing Supabase database structure with `Students` (`uuid`, `name`, `roll_no`, `department`, `semester`, `created_at`), `Courses` (`uuid`, `name`, `code`, `semester`, `created_at`), and `Attendance` (`id`, `student_id`, `course`, `date`, `status`); keep browser configuration limited to the public URL and anon key, and provide an interactive local demo fallback when those values are not present.
- [ ] **Create the dashboard** — Show key attendance information and useful summaries from the loaded data, including student count, course count, attendance rate, daily presence, trend information, and recent activity, with loading and error states.
- [ ] **Add/manage students** — Add, view, edit, and delete student records with name, roll number, department, and semester fields; validate required fields and prevent duplicate roll numbers within the loaded list.
- [ ] **Add/manage courses** — Add, view, edit, and delete course records with name, code, and semester fields; validate required fields and prevent duplicate course codes within the loaded list.
- [ ] **Mark Present/Absent attendance** — Mark each student Present or Absent for a selected course and date, update existing same-student/course/date records rather than creating duplicates, and save the roster with a clear result message.
- [ ] **View attendance records** — View saved attendance records with student, course, date, and status details, including an empty state when no records exist.
- [ ] **Add search/filter functionality** — Search and filter students, courses, and attendance records by relevant fields such as name, roll number, department, semester, course, date, and status.
- [ ] **Test everything** — Validate forms, loading and error handling, demo-mode CRUD, attendance upsert behavior, responsive layout, and the production build.
- [ ] **Finally connect it with GitHub** — Preserve the completed project in the managed repository workflow and connect the canonical project repository to the user's GitHub only through the platform confirmation flow.
