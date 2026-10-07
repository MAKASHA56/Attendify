import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Filter,
  LayoutDashboard,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import {
  createCourse,
  createStudent,
  deleteCourse as removeCourse,
  deleteStudent as removeStudent,
  formatDate,
  formatShortDate,
  getAttendanceKey,
  loadData,
  saveAttendance,
  updateCourse,
  updateStudent,
  type AppData,
  type AttendanceRecord,
  type AttendanceStatus,
  type Course,
  type Student,
} from './lib/data'
import { isSupabaseConfigured } from './lib/supabase'

type View = 'dashboard' | 'students' | 'courses' | 'attendance'
type ToastState = { kind: 'success' | 'error'; message: string } | null

type NavItem = { id: View; label: string; icon: typeof LayoutDashboard; note: string }

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, note: 'Your daily pulse' },
  { id: 'students', label: 'Students', icon: UsersRound, note: 'People in your ledger' },
  { id: 'courses', label: 'Courses', icon: BookOpen, note: 'Classes & modules' },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, note: 'Mark & review' },
]

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.'
const todayLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())
const currentYear = new Date().getFullYear()

function useAttendanceData() {
  const [data, setData] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setData(await loadData())
      setError('')
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  return { data, loading, error, setError, refresh }
}

export default function App() {
  const { data, loading, error, setError, refresh } = useAttendanceData()
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [mutating, setMutating] = useState(false)

  const showToast = useCallback((nextToast: Exclude<ToastState, null>) => {
    setToast(nextToast)
    window.setTimeout(() => setToast(null), 3400)
  }, [])

  const runMutation = useCallback(async (operation: () => Promise<unknown>, successMessage: string) => {
    setMutating(true)
    setError('')
    try {
      await operation()
      await refresh()
      showToast({ kind: 'success', message: successMessage })
      return true
    } catch (mutationError) {
      const message = getErrorMessage(mutationError)
      setError(message)
      showToast({ kind: 'error', message })
      return false
    } finally {
      setMutating(false)
    }
  }, [refresh, setError, showToast])

  const navigate = (view: View) => {
    setActiveView(view)
    setMobileNavOpen(false)
  }

  const pageMeta: Record<View, { eyebrow: string; title: string; description: string }> = {
    dashboard: { eyebrow: 'Today · Academic year 2026', title: 'A clearer view of the week.', description: 'Keep a steady pulse on every room, roster, and record.' },
    students: { eyebrow: 'People directory', title: 'Students', description: 'The people behind every attendance mark.' },
    courses: { eyebrow: 'Academic catalogue', title: 'Courses', description: 'Keep modules tidy before the day gets busy.' },
    attendance: { eyebrow: 'Daily ledger', title: 'Attendance', description: 'Record the room, then move on.' },
  }
  const meta = pageMeta[activeView]

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onNavigate={navigate} mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <main className="main-shell">
        <div className="mobile-topbar">
          <button className="icon-button mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><SlidersHorizontal size={19} /></button>
          <div className="mobile-wordmark"><span className="mini-seal">A</span><span>Attendify</span></div>
          <span className="mobile-date">{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date())}</span>
        </div>
        <div className="page-content">
          <PageHeader meta={meta} activeView={activeView} onNavigate={navigate} />
          {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
          {loading && !data ? <LoadingState /> : data ? (
            <>
              {activeView === 'dashboard' && <DashboardView data={data} onNavigate={navigate} />}
              {activeView === 'students' && <StudentsView students={data.students} onSave={async (id, input) => runMutation(() => id ? updateStudent(id, input) : createStudent(input), id ? 'Student record updated.' : 'Student added to the ledger.')} onDelete={async (id) => runMutation(() => removeStudent(id), 'Student removed from the ledger.')} busy={mutating} />}
              {activeView === 'courses' && <CoursesView courses={data.courses} onSave={async (id, input) => runMutation(() => id ? updateCourse(id, input) : createCourse(input), id ? 'Course record updated.' : 'Course added to the catalogue.')} onDelete={async (id) => runMutation(() => removeCourse(id), 'Course removed from the catalogue.')} busy={mutating} />}
              {activeView === 'attendance' && <AttendanceView data={data} onSaveRoster={async (inputs) => runMutation(() => Promise.all(inputs.map((input) => saveAttendance(input))), 'Attendance saved for the selected roster.')} busy={mutating} />}
            </>
          ) : <ErrorState onRetry={() => void refresh()} />}
        </div>
        <footer className="app-footer"><span>Attendify / Student attendance ledger</span><span>{currentYear} · Made for calmer academic days</span></footer>
      </main>
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function Sidebar({ activeView, onNavigate, mobileOpen, onClose }: { activeView: View; onNavigate: (view: View) => void; mobileOpen: boolean; onClose: () => void }) {
  return (
    <>
      {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-seal"><span>A</span></div>
          <div><div className="brand-name">Attendify</div><div className="brand-caption">Attendance, composed.</div></div>
          <button className="icon-button sidebar-close" aria-label="Close navigation" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="sidebar-rule" />
        <div className="nav-label">Workspace</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const selected = activeView === item.id
            return <button key={item.id} className={`nav-item ${selected ? 'nav-item-active' : ''}`} onClick={() => onNavigate(item.id)}><span className="nav-icon"><Icon size={17} strokeWidth={selected ? 2.3 : 1.8} /></span><span className="nav-copy"><strong>{item.label}</strong><small>{item.note}</small></span>{selected && <ChevronRight className="nav-arrow" size={15} />}</button>
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><Sparkles size={16} /><div><strong>Keep it simple.</strong><span>One room at a time.</span></div></div>
          <button className="settings-button"><Settings2 size={16} /> Settings <span className="coming-soon">Soon</span></button>
          <div className="mode-pill"><span className={`mode-dot ${isSupabaseConfigured ? 'mode-dot-live' : ''}`} />{isSupabaseConfigured ? 'Supabase connected' : 'Demo mode active'}</div>
        </div>
      </aside>
    </>
  )
}

function PageHeader({ meta, activeView, onNavigate }: { meta: { eyebrow: string; title: string; description: string }; activeView: View; onNavigate: (view: View) => void }) {
  return (
    <header className={`page-header page-header-${activeView}`}>
      <div><div className="eyebrow"><span className="eyebrow-line" />{meta.eyebrow}</div><h1>{meta.title}</h1><p>{meta.description}</p></div>
      <div className="header-actions"><div className="date-stamp"><CalendarDays size={15} /><span>{todayLabel}</span></div>{activeView === 'dashboard' && <button className="button button-primary" onClick={() => onNavigate('attendance')}><ClipboardCheck size={16} /> Mark attendance <ChevronRight size={15} /></button>}</div>
    </header>
  )
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return <div className="error-banner"><CircleAlert size={17} /><div><strong>Couldn’t refresh the ledger.</strong><span>{message}</span></div><button className="icon-button" aria-label="Dismiss error" onClick={onDismiss}><X size={16} /></button></div>
}

function LoadingState() {
  return <div className="loading-state"><LoaderCircle size={26} className="spin" /><span>Opening your ledger…</span></div>
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div className="empty-state empty-state-large"><CircleAlert size={28} /><h3>We couldn’t open the ledger.</h3><p>Check your Supabase connection or try again.</p><button className="button button-secondary" onClick={onRetry}>Try again</button></div>
}

function Toast({ toast, onClose }: { toast: Exclude<ToastState, null>; onClose: () => void }) {
  return <div className={`toast toast-${toast.kind}`} role="status"><span className="toast-icon">{toast.kind === 'success' ? <Check size={15} /> : <CircleAlert size={15} />}</span><span>{toast.message}</span><button className="toast-close" onClick={onClose} aria-label="Close notification"><X size={14} /></button></div>
}

function DashboardView({ data, onNavigate }: { data: AppData; onNavigate: (view: View) => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const presentCount = data.attendance.filter((item) => item.status.toLowerCase() === 'present').length
  const attendanceRate = data.attendance.length ? Math.round((presentCount / data.attendance.length) * 100) : 0
  const todayRecords = data.attendance.filter((item) => item.date === today)
  const todayPresent = todayRecords.filter((item) => item.status.toLowerCase() === 'present').length
  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    const records = data.attendance.filter((item) => item.date === key)
    return { key, label: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date).slice(0, 2), value: records.length ? Math.round((records.filter((item) => item.status.toLowerCase() === 'present').length / records.length) * 100) : 0, count: records.length }
  })
  const recent = [...data.attendance].sort((a, b) => `${b.date}-${b.id}`.localeCompare(`${a.date}-${a.id}`)).slice(0, 5)
  const departmentCounts = Object.entries(data.students.reduce<Record<string, number>>((acc, student) => { acc[student.department] = (acc[student.department] ?? 0) + 1; return acc }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const maxDepartment = Math.max(...departmentCounts.map(([, count]) => count), 1)
  const studentName = (id: string) => data.students.find((student) => student.uuid === id)?.name ?? 'Unknown student'
  const courseName = (id: string) => data.courses.find((course) => course.uuid === id)?.name ?? 'Unknown course'

  return <div className="view-stack dashboard-stack">
    <section className="metric-grid">
      <MetricCard label="Students" value={data.students.length} detail="Active in directory" icon={<UsersRound size={17} />} tone="navy" />
      <MetricCard label="Courses" value={data.courses.length} detail="Across current terms" icon={<BookOpen size={17} />} tone="sand" />
      <MetricCard label="Attendance rate" value={`${attendanceRate}%`} detail={`${presentCount} present marks`} icon={<Activity size={17} />} tone="mint" trend={attendanceRate >= 75 ? 'On track' : 'Needs a look'} />
      <MetricCard label="Today" value={`${todayPresent}/${todayRecords.length || data.students.length}`} detail={todayRecords.length ? 'Present this day' : 'No marks yet'} icon={<CalendarDays size={17} />} tone="blue" />
    </section>
    <section className="dashboard-main-grid">
      <div className="panel trend-panel"><PanelHeading eyebrow="Attendance pulse" title="The week, at a glance." action={<button className="text-button" onClick={() => onNavigate('attendance')}>Open ledger <ArrowUpRight size={14} /></button>} /><div className="trend-chart"><div className="chart-y-labels"><span>100%</span><span>50%</span><span>0%</span></div><div className="chart-plot"><div className="chart-guides"><span /><span /><span /></div><div className="bars">{trend.map((day) => <div className="bar-column" key={day.key}><div className="bar-value">{day.count ? `${day.value}%` : '—'}</div><div className="bar-track"><div className="bar-fill" style={{ height: `${Math.max(day.value, day.count ? 8 : 3)}%` }} /></div><span className="bar-label">{day.label}</span></div>)}</div></div></div><div className="trend-footnote"><span><i className="legend-dot" /> Present ratio</span><span>{trend.filter((day) => day.count).length} active days</span></div></div>
      <div className="panel department-panel"><PanelHeading eyebrow="Directory mix" title="Where the room is." action={<button className="text-button" onClick={() => onNavigate('students')}>View students <ArrowUpRight size={14} /></button>} /><div className="department-list">{departmentCounts.length ? departmentCounts.map(([department, count]) => <div className="department-row" key={department}><div className="department-meta"><span>{department}</span><strong>{count}</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${(count / maxDepartment) * 100}%` }} /></div></div>) : <EmptyState title="No departments yet" description="Add students to see the mix." />}</div><div className="department-total"><span>Directory total</span><strong>{data.students.length} students</strong></div></div>
    </section>
    <section className="dashboard-bottom-grid"><div className="panel recent-panel"><PanelHeading eyebrow="Latest marks" title="Recent activity." action={<button className="text-button" onClick={() => onNavigate('attendance')}>See all <ArrowUpRight size={14} /></button>} />{recent.length ? <div className="activity-list">{recent.map((record) => <div className="activity-row" key={record.id}><div className={`activity-avatar ${record.status.toLowerCase() === 'present' ? 'avatar-present' : 'avatar-absent'}`}>{studentName(record.student_id).split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div className="activity-copy"><strong>{studentName(record.student_id)}</strong><span>{courseName(record.course)} · {formatShortDate(record.date)}</span></div><StatusBadge status={record.status} /></div>)}</div> : <EmptyState title="No attendance yet" description="Your latest marks will appear here." />}</div><div className="panel note-panel"><div className="note-mark"><Sparkles size={18} /></div><div className="eyebrow">A small note</div><h3>Good records make good patterns.</h3><p>Mark attendance while the room is still fresh. Attendify keeps the details close and the noise low.</p><button className="button button-secondary button-small" onClick={() => onNavigate('attendance')}>Open today’s roster <ChevronRight size={14} /></button></div></section>
  </div>
}

function MetricCard({ label, value, detail, icon, tone, trend }: { label: string; value: string | number; detail: string; icon: ReactNode; tone: string; trend?: string }) {
  return <div className={`metric-card metric-${tone}`}><div className="metric-top"><span className="metric-label">{label}</span><span className="metric-icon">{icon}</span></div><div className="metric-value">{value}</div><div className="metric-detail">{trend ? <><span className="metric-trend"><ArrowUpRight size={13} /> {trend}</span> · </> : null}{detail}</div></div>
}

function PanelHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <div className="panel-heading"><div><div className="eyebrow eyebrow-small">{eyebrow}</div><h2>{title}</h2></div>{action}</div>
}

function StudentsView({ students, onSave, onDelete, busy }: { students: Student[]; onSave: (id: string | undefined, input: Omit<Student, 'uuid' | 'created_at'>) => Promise<boolean>; onDelete: (id: string) => Promise<boolean>; busy: boolean }) {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  const [semester, setSemester] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const departments = useMemo(() => [...new Set(students.map((student) => student.department))].sort(), [students])
  const semesters = useMemo(() => [...new Set(students.map((student) => String(student.semester)))].sort((a, b) => Number(a) - Number(b)), [students])
  const filtered = useMemo(() => students.filter((student) => { const search = query.toLowerCase(); const matchesSearch = !search || [student.name, student.roll_no, student.department, String(student.semester)].some((value) => value.toLowerCase().includes(search)); return matchesSearch && (department === 'all' || student.department === department) && (semester === 'all' || String(student.semester) === semester) }).sort((a, b) => a.name.localeCompare(b.name)), [students, query, department, semester])
  const openNew = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (student: Student) => { setEditing(student); setModalOpen(true) }
  const save = async (id: string | undefined, input: Omit<Student, 'uuid' | 'created_at'>) => { const duplicate = students.some((student) => student.roll_no.toLowerCase() === input.roll_no.toLowerCase() && student.uuid !== id); if (duplicate) return false; const saved = await onSave(id, input); if (saved) setModalOpen(false); return saved }
  const deleteRecord = async (student: Student) => { if (window.confirm(`Remove ${student.name} from the ledger?`)) await onDelete(student.uuid) }

  return <div className="view-stack"><section className="section-toolbar"><div className="toolbar-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, roll number, department…" aria-label="Search students" /></div><div className="toolbar-filters"><div className="select-wrap"><Filter size={14} /><select value={department} onChange={(event) => setDepartment(event.target.value)} aria-label="Filter by department"><option value="all">All departments</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div className="select-wrap"><select value={semester} onChange={(event) => setSemester(event.target.value)} aria-label="Filter by semester"><option value="all">All semesters</option>{semesters.map((item) => <option key={item} value={item}>Semester {item}</option>)}</select></div><button className="button button-primary" onClick={openNew}><Plus size={16} /> Add student</button></div></section><section className="table-panel panel"><div className="table-panel-heading"><div><div className="eyebrow eyebrow-small">Directory / {filtered.length} shown</div><h2>Student records</h2></div><span className="table-note"><span className="live-dot" /> Live directory</span></div>{filtered.length ? <div className="table-scroll"><table><thead><tr><th>Student</th><th>Roll number</th><th>Department</th><th>Semester</th><th>Added</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((student) => <tr key={student.uuid}><td><div className="person-cell"><span className="person-avatar">{student.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><strong>{student.name}</strong></div></td><td><span className="mono-text">{student.roll_no}</span></td><td>{student.department}</td><td><span className="semester-chip">Sem {student.semester}</span></td><td className="muted-cell">{student.created_at ? formatDate(student.created_at.slice(0, 10)) : '—'}</td><td><div className="row-actions"><button className="icon-button" aria-label={`Edit ${student.name}`} onClick={() => openEdit(student)}><Pencil size={15} /></button><button className="icon-button danger-button" aria-label={`Delete ${student.name}`} onClick={() => void deleteRecord(student)} disabled={busy}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No students match that view" description="Try clearing a filter or add the first student." action={<button className="button button-secondary" onClick={openNew}><Plus size={15} /> Add student</button>} />}</section>{modalOpen && <StudentModal student={editing} onClose={() => setModalOpen(false)} onSave={save} busy={busy} />}</div>
}

function CoursesView({ courses, onSave, onDelete, busy }: { courses: Course[]; onSave: (id: string | undefined, input: Omit<Course, 'uuid' | 'created_at'>) => Promise<boolean>; onDelete: (id: string) => Promise<boolean>; busy: boolean }) {
  const [query, setQuery] = useState('')
  const [semester, setSemester] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const semesters = useMemo(() => [...new Set(courses.map((course) => String(course.semester)))].sort((a, b) => Number(a) - Number(b)), [courses])
  const filtered = useMemo(() => courses.filter((course) => { const search = query.toLowerCase(); const matchesSearch = !search || [course.name, course.code, String(course.semester)].some((value) => value.toLowerCase().includes(search)); return matchesSearch && (semester === 'all' || String(course.semester) === semester) }).sort((a, b) => a.name.localeCompare(b.name)), [courses, query, semester])
  const save = async (id: string | undefined, input: Omit<Course, 'uuid' | 'created_at'>) => { const duplicate = courses.some((course) => course.code.toLowerCase() === input.code.toLowerCase() && course.uuid !== id); if (duplicate) return false; const saved = await onSave(id, input); if (saved) setModalOpen(false); return saved }
  const deleteRecord = async (course: Course) => { if (window.confirm(`Remove ${course.name} from the catalogue?`)) await onDelete(course.uuid) }

  return <div className="view-stack"><section className="section-toolbar"><div className="toolbar-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course name or code…" aria-label="Search courses" /></div><div className="toolbar-filters"><div className="select-wrap"><Filter size={14} /><select value={semester} onChange={(event) => setSemester(event.target.value)} aria-label="Filter courses by semester"><option value="all">All semesters</option>{semesters.map((item) => <option key={item} value={item}>Semester {item}</option>)}</select></div><button className="button button-primary" onClick={() => { setEditing(null); setModalOpen(true) }}><Plus size={16} /> Add course</button></div></section><section className="course-card-grid">{filtered.length ? filtered.map((course) => <article className="course-card panel" key={course.uuid}><div className="course-card-top"><span className="course-symbol"><BookOpen size={17} /></span><span className="semester-chip">Sem {course.semester}</span></div><div className="course-code">{course.code}</div><h2>{course.name}</h2><div className="course-card-bottom"><span>Added {course.created_at ? formatDate(course.created_at.slice(0, 10)) : 'recently'}</span><div className="row-actions"><button className="icon-button" aria-label={`Edit ${course.name}`} onClick={() => { setEditing(course); setModalOpen(true) }}><Pencil size={15} /></button><button className="icon-button danger-button" aria-label={`Delete ${course.name}`} onClick={() => void deleteRecord(course)} disabled={busy}><Trash2 size={15} /></button></div></div></article>) : <div className="panel course-empty"><EmptyState title="No courses match that view" description="Try clearing a filter or add the first course." action={<button className="button button-secondary" onClick={() => { setEditing(null); setModalOpen(true) }}><Plus size={15} /> Add course</button>} /></div>}</section>{modalOpen && <CourseModal course={editing} onClose={() => setModalOpen(false)} onSave={save} busy={busy} />}</div>
}

function AttendanceView({ data, onSaveRoster, busy }: { data: AppData; onSaveRoster: (inputs: Array<Omit<AttendanceRecord, 'id'>>) => Promise<boolean>; busy: boolean }) {
  const [tab, setTab] = useState<'mark' | 'records'>('mark')
  const [selectedCourse, setSelectedCourse] = useState(data.courses[0]?.uuid ?? '')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [rosterQuery, setRosterQuery] = useState('')
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({})
  const [recordQuery, setRecordQuery] = useState('')
  const [recordStatus, setRecordStatus] = useState('all')
  const [recordDate, setRecordDate] = useState('all')

  useEffect(() => {
    const nextStatuses: Record<string, AttendanceStatus> = {}
    data.students.forEach((student) => {
      const existing = data.attendance.find((record) => getAttendanceKey(record.student_id, record.course, record.date) === getAttendanceKey(student.uuid, selectedCourse, selectedDate))
      nextStatuses[student.uuid] = existing?.status.toLowerCase() === 'absent' ? 'Absent' : 'Present'
    })
    setStatuses(nextStatuses)
  }, [data.attendance, data.students, selectedCourse, selectedDate])

  const selectedCourseRecord = data.courses.find((course) => course.uuid === selectedCourse)
  const roster = data.students.filter((student) => { const query = rosterQuery.toLowerCase(); return !query || [student.name, student.roll_no, student.department].some((value) => value.toLowerCase().includes(query)) }).sort((a, b) => a.name.localeCompare(b.name))
  const dates = [...new Set(data.attendance.map((record) => record.date))].sort((a, b) => b.localeCompare(a))
  const records = data.attendance.filter((record) => {
    const student = data.students.find((item) => item.uuid === record.student_id)
    const course = data.courses.find((item) => item.uuid === record.course)
    const search = recordQuery.toLowerCase()
    const matchesSearch = !search || [student?.name ?? '', student?.roll_no ?? '', course?.name ?? '', course?.code ?? '', record.date].some((value) => value.toLowerCase().includes(search))
    const matchesStatus = recordStatus === 'all' || record.status.toLowerCase() === recordStatus.toLowerCase()
    const matchesDate = recordDate === 'all' || record.date === recordDate
    return matchesSearch && matchesStatus && matchesDate
  }).sort((a, b) => `${b.date}-${b.id}`.localeCompare(`${a.date}-${a.id}`))

  const saveRoster = async () => {
    if (!selectedCourse || !data.students.length) return false
    return onSaveRoster(data.students.map((student) => ({ student_id: student.uuid, course: selectedCourse, date: selectedDate, status: statuses[student.uuid] ?? 'Present' })))
  }

  const courseName = (id: string) => data.courses.find((course) => course.uuid === id)?.name ?? 'Unknown course'
  const studentName = (id: string) => data.students.find((student) => student.uuid === id)?.name ?? 'Unknown student'

  return <div className="view-stack attendance-stack"><section className="attendance-tabs"><button className={tab === 'mark' ? 'tab-active' : ''} onClick={() => setTab('mark')}><ClipboardCheck size={16} /> Mark attendance</button><button className={tab === 'records' ? 'tab-active' : ''} onClick={() => setTab('records')}><Activity size={16} /> Saved records <span className="tab-count">{data.attendance.length}</span></button></section>{tab === 'mark' ? <section className="attendance-workspace"><div className="panel attendance-controls"><div><div className="eyebrow eyebrow-small">New attendance entry</div><h2>Set the room.</h2><p>Choose a course and date, then give each student a clear mark.</p></div><div className="attendance-selects"><label><span>Course</span><select value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)}><option value="">Select a course</option>{data.courses.map((course) => <option value={course.uuid} key={course.uuid}>{course.code} · {course.name}</option>)}</select></label><label><span>Date</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label></div></div><div className="panel roster-panel"><div className="roster-heading"><div><div className="eyebrow eyebrow-small">{selectedCourseRecord?.code ?? 'Course'} · {formatShortDate(selectedDate)}</div><h2>{selectedCourseRecord?.name ?? 'Choose a course'} <span className="roster-count">{data.students.length} students</span></h2></div><div className="roster-actions"><div className="toolbar-search roster-search"><Search size={16} /><input value={rosterQuery} onChange={(event) => setRosterQuery(event.target.value)} placeholder="Find a student…" aria-label="Find a student in roster" /></div><button className="button button-primary" disabled={busy || !selectedCourse || !data.students.length} onClick={() => void saveRoster()}>{busy ? <LoaderCircle size={15} className="spin" /> : <CheckCircle2 size={16} />} Save roster</button></div></div>{roster.length ? <div className="roster-list">{roster.map((student, index) => <div className="roster-row" key={student.uuid}><span className="roster-index">{String(index + 1).padStart(2, '0')}</span><span className="person-avatar">{student.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><div className="roster-person"><strong>{student.name}</strong><span>{student.roll_no} · {student.department}</span></div><div className="status-toggle"><button className={statuses[student.uuid] === 'Present' ? 'status-choice choice-present' : ''} onClick={() => setStatuses((current) => ({ ...current, [student.uuid]: 'Present' }))}><Check size={14} /> Present</button><button className={statuses[student.uuid] === 'Absent' ? 'status-choice choice-absent' : ''} onClick={() => setStatuses((current) => ({ ...current, [student.uuid]: 'Absent' }))}><X size={14} /> Absent</button></div></div>)}</div> : <EmptyState title="No students match" description="Try a different search." />}</div></section> : <RecordsView records={records} recordQuery={recordQuery} setRecordQuery={setRecordQuery} recordStatus={recordStatus} setRecordStatus={setRecordStatus} recordDate={recordDate} setRecordDate={setRecordDate} dates={dates} studentName={studentName} courseName={courseName} />}</div>
}

function RecordsView({ records, recordQuery, setRecordQuery, recordStatus, setRecordStatus, recordDate, setRecordDate, dates, studentName, courseName }: { records: AttendanceRecord[]; recordQuery: string; setRecordQuery: (value: string) => void; recordStatus: string; setRecordStatus: (value: string) => void; recordDate: string; setRecordDate: (value: string) => void; dates: string[]; studentName: (id: string) => string; courseName: (id: string) => string }) {
  return <section className="panel records-panel"><div className="table-panel-heading"><div><div className="eyebrow eyebrow-small">Attendance / {records.length} shown</div><h2>Saved records</h2></div><span className="table-note"><span className="live-dot" /> Supabase-ready</span></div><div className="records-toolbar"><div className="toolbar-search"><Search size={17} /><input value={recordQuery} onChange={(event) => setRecordQuery(event.target.value)} placeholder="Search student, course, roll number…" aria-label="Search attendance records" /></div><div className="toolbar-filters"><div className="select-wrap"><Filter size={14} /><select value={recordStatus} onChange={(event) => setRecordStatus(event.target.value)} aria-label="Filter records by status"><option value="all">All statuses</option><option value="present">Present</option><option value="absent">Absent</option></select></div><div className="select-wrap"><CalendarDays size={14} /><select value={recordDate} onChange={(event) => setRecordDate(event.target.value)} aria-label="Filter records by date"><option value="all">All dates</option>{dates.map((date) => <option value={date} key={date}>{formatDate(date)}</option>)}</select></div></div></div>{records.length ? <div className="table-scroll"><table><thead><tr><th>Student</th><th>Course</th><th>Date</th><th>Status</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><div className="person-cell"><span className="person-avatar">{studentName(record.student_id).split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><strong>{studentName(record.student_id)}</strong></div></td><td><span className="mono-text">{courseName(record.course)}</span></td><td className="muted-cell">{formatDate(record.date)}</td><td><StatusBadge status={record.status} /></td></tr>)}</tbody></table></div> : <EmptyState title="No records match that view" description="Try clearing a filter or mark a roster first." />}</section>
}

function StatusBadge({ status }: { status: string }) {
  const present = status.toLowerCase() === 'present'
  return <span className={`status-badge ${present ? 'status-badge-present' : 'status-badge-absent'}`}><span />{present ? 'Present' : 'Absent'}</span>
}

function StudentModal({ student, onClose, onSave, busy }: { student: Student | null; onClose: () => void; onSave: (id: string | undefined, input: Omit<Student, 'uuid' | 'created_at'>) => Promise<boolean>; busy: boolean }) {
  const [draft, setDraft] = useState({ name: student?.name ?? '', roll_no: student?.roll_no ?? '', department: student?.department ?? '', semester: String(student?.semester ?? '') })
  const [validation, setValidation] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!draft.name.trim() || !draft.roll_no.trim() || !draft.department.trim() || !draft.semester.trim()) { setValidation('Complete every field before saving.'); return } if (!Number.isFinite(Number(draft.semester)) || Number(draft.semester) < 1) { setValidation('Semester must be a positive number.'); return } const saved = await onSave(student?.uuid, { name: draft.name.trim(), roll_no: draft.roll_no.trim(), department: draft.department.trim(), semester: Number(draft.semester) }); if (!saved) setValidation('That roll number is already in the ledger.') }
  return <Modal title={student ? 'Edit student' : 'Add student'} eyebrow={student ? 'Update directory' : 'New directory entry'} onClose={onClose}><form onSubmit={submit} className="form-stack"><div className="form-intro">{student ? 'Keep the details current and the ledger useful.' : 'Add a student to the directory in four small fields.'}</div><Field label="Full name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} placeholder="e.g. Aditi Menon" autoFocus /><Field label="Roll number" value={draft.roll_no} onChange={(value) => setDraft({ ...draft, roll_no: value })} placeholder="e.g. CS-24-012" /><Field label="Department" value={draft.department} onChange={(value) => setDraft({ ...draft, department: value })} placeholder="e.g. Computer Science" /><Field label="Semester" type="number" value={draft.semester} onChange={(value) => setDraft({ ...draft, semester: value })} placeholder="e.g. 4" min="1" max="16" />{validation && <div className="form-error"><CircleAlert size={15} />{validation}</div>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />}{student ? 'Save changes' : 'Add student'}</button></div></form></Modal>
}

function CourseModal({ course, onClose, onSave, busy }: { course: Course | null; onClose: () => void; onSave: (id: string | undefined, input: Omit<Course, 'uuid' | 'created_at'>) => Promise<boolean>; busy: boolean }) {
  const [draft, setDraft] = useState({ name: course?.name ?? '', code: course?.code ?? '', semester: String(course?.semester ?? '') })
  const [validation, setValidation] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!draft.name.trim() || !draft.code.trim() || !draft.semester.trim()) { setValidation('Complete every field before saving.'); return } if (!Number.isFinite(Number(draft.semester)) || Number(draft.semester) < 1) { setValidation('Semester must be a positive number.'); return } const saved = await onSave(course?.uuid, { name: draft.name.trim(), code: draft.code.trim(), semester: Number(draft.semester) }); if (!saved) setValidation('That course code is already in the catalogue.') }
  return <Modal title={course ? 'Edit course' : 'Add course'} eyebrow={course ? 'Update catalogue' : 'New catalogue entry'} onClose={onClose}><form onSubmit={submit} className="form-stack"><div className="form-intro">{course ? 'Give this course the right place in the catalogue.' : 'A tidy catalogue makes every roster easier.'}</div><Field label="Course name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} placeholder="e.g. Human Computer Interaction" autoFocus /><Field label="Course code" value={draft.code} onChange={(value) => setDraft({ ...draft, code: value })} placeholder="e.g. CS 410" /><Field label="Semester" type="number" value={draft.semester} onChange={(value) => setDraft({ ...draft, semester: value })} placeholder="e.g. 4" min="1" max="16" />{validation && <div className="form-error"><CircleAlert size={15} />{validation}</div>}<div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? <LoaderCircle size={15} className="spin" /> : <Check size={15} />}{course ? 'Save changes' : 'Add course'}</button></div></form></Modal>
}

function Modal({ title, eyebrow, onClose, children }: { title: string; eyebrow: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="modal-card" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><div className="eyebrow eyebrow-small">{eyebrow}</div><h2>{title}</h2></div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></div>{children}</div></div>
}

function Field({ label, value, onChange, placeholder, type = 'text', min, max, autoFocus }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; min?: string; max?: string; autoFocus?: boolean }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} min={min} max={max} autoFocus={autoFocus} /></label>
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><ClipboardCheck size={20} /></div><h3>{title}</h3><p>{description}</p>{action}</div>
}
