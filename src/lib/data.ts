import { supabase } from './supabase'

export type AttendanceStatus = 'Present' | 'Absent'

export interface Student {
  uuid: string
  name: string
  roll_no: string
  department: string
  semester: number | string
  created_at?: string
}

export interface Course {
  uuid: string
  name: string
  code: string
  semester: number | string
  created_at?: string
}

export interface AttendanceRecord {
  id: number | string
  student_id: string
  course: string
  date: string
  status: AttendanceStatus | string
}

export interface AppData {
  students: Student[]
  courses: Course[]
  attendance: AttendanceRecord[]
}

const STORAGE_KEY = 'attendly-demo-data-v1'

const demoStudents: Student[] = [
  { uuid: 'student-001', name: 'Aarav Mehta', roll_no: 'CS-24-001', department: 'Computer Science', semester: 4, created_at: '2026-01-08T09:00:00Z' },
  { uuid: 'student-002', name: 'Diya Kapoor', roll_no: 'CS-24-014', department: 'Computer Science', semester: 4, created_at: '2026-01-10T09:00:00Z' },
  { uuid: 'student-003', name: 'Rohan Iyer', roll_no: 'DS-23-007', department: 'Data Science', semester: 6, created_at: '2026-01-12T09:00:00Z' },
  { uuid: 'student-004', name: 'Saanvi Rao', roll_no: 'EC-25-003', department: 'Electronics', semester: 2, created_at: '2026-01-15T09:00:00Z' },
  { uuid: 'student-005', name: 'Kabir Shah', roll_no: 'BA-24-021', department: 'Business Analytics', semester: 4, created_at: '2026-01-18T09:00:00Z' },
  { uuid: 'student-006', name: 'Nisha Verma', roll_no: 'DS-23-013', department: 'Data Science', semester: 6, created_at: '2026-01-20T09:00:00Z' },
  { uuid: 'student-007', name: 'Vihaan Bose', roll_no: 'EC-25-011', department: 'Electronics', semester: 2, created_at: '2026-01-22T09:00:00Z' },
  { uuid: 'student-008', name: 'Anaya Sen', roll_no: 'BA-24-034', department: 'Business Analytics', semester: 4, created_at: '2026-01-25T09:00:00Z' },
]

const demoCourses: Course[] = [
  { uuid: 'course-001', name: 'Database Systems', code: 'CS 402', semester: 4, created_at: '2026-01-06T09:00:00Z' },
  { uuid: 'course-002', name: 'Applied Statistics', code: 'DS 306', semester: 6, created_at: '2026-01-07T09:00:00Z' },
  { uuid: 'course-003', name: 'Digital Electronics', code: 'EC 210', semester: 2, created_at: '2026-01-09T09:00:00Z' },
  { uuid: 'course-004', name: 'Business Intelligence', code: 'BA 318', semester: 4, created_at: '2026-01-11T09:00:00Z' },
]

const isoDaysAgo = (daysAgo: number) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().slice(0, 10)
}

const demoAttendance: AttendanceRecord[] = [
  { id: 1001, student_id: 'student-001', course: 'course-001', date: isoDaysAgo(0), status: 'Present' },
  { id: 1002, student_id: 'student-002', course: 'course-001', date: isoDaysAgo(0), status: 'Present' },
  { id: 1003, student_id: 'student-003', course: 'course-002', date: isoDaysAgo(0), status: 'Absent' },
  { id: 1004, student_id: 'student-004', course: 'course-003', date: isoDaysAgo(1), status: 'Present' },
  { id: 1005, student_id: 'student-005', course: 'course-004', date: isoDaysAgo(1), status: 'Present' },
  { id: 1006, student_id: 'student-006', course: 'course-002', date: isoDaysAgo(1), status: 'Present' },
  { id: 1007, student_id: 'student-007', course: 'course-003', date: isoDaysAgo(2), status: 'Present' },
  { id: 1008, student_id: 'student-008', course: 'course-004', date: isoDaysAgo(2), status: 'Absent' },
  { id: 1009, student_id: 'student-001', course: 'course-001', date: isoDaysAgo(3), status: 'Present' },
  { id: 1010, student_id: 'student-002', course: 'course-001', date: isoDaysAgo(3), status: 'Absent' },
  { id: 1011, student_id: 'student-003', course: 'course-002', date: isoDaysAgo(4), status: 'Present' },
  { id: 1012, student_id: 'student-006', course: 'course-002', date: isoDaysAgo(4), status: 'Present' },
]

const seedData: AppData = { students: demoStudents, courses: demoCourses, attendance: demoAttendance }

const copyData = (data: AppData): AppData => JSON.parse(JSON.stringify(data)) as AppData

function readDemoData(): AppData {
  if (typeof window === 'undefined') return copyData(seedData)
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as AppData) : copyData(seedData)
  } catch {
    return copyData(seedData)
  }
}

function writeDemoData(data: AppData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function dataError(error: { message?: string } | null): Error | null {
  return error ? new Error(error.message || 'Supabase request failed.') : null
}

export async function loadData(): Promise<AppData> {
  if (!supabase) return readDemoData()

  const [studentsResponse, coursesResponse, attendanceResponse] = await Promise.all([
    supabase.from('Students').select('*').order('created_at', { ascending: false }),
    supabase.from('Courses').select('*').order('created_at', { ascending: false }),
    supabase.from('Attendance').select('*').order('date', { ascending: false }),
  ])

  const error = dataError(studentsResponse.error) || dataError(coursesResponse.error) || dataError(attendanceResponse.error)
  if (error) throw error

  return {
    students: (studentsResponse.data ?? []) as Student[],
    courses: (coursesResponse.data ?? []) as Course[],
    attendance: (attendanceResponse.data ?? []) as AttendanceRecord[],
  }
}

const localId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`

export async function createStudent(input: Omit<Student, 'uuid' | 'created_at'>): Promise<Student> {
  if (!supabase) {
    const data = readDemoData()
    const student: Student = { ...input, uuid: localId('student'), created_at: new Date().toISOString() }
    writeDemoData({ ...data, students: [student, ...data.students] })
    return student
  }
  const { data, error } = await supabase.from('Students').insert(input).select().single()
  const requestError = dataError(error)
  if (requestError) throw requestError
  return data as Student
}

export async function updateStudent(uuid: string, input: Omit<Student, 'uuid' | 'created_at'>): Promise<Student> {
  if (!supabase) {
    const data = readDemoData()
    const student = { ...data.students.find((item) => item.uuid === uuid), ...input, uuid } as Student
    writeDemoData({ ...data, students: data.students.map((item) => (item.uuid === uuid ? student : item)) })
    return student
  }
  const { data, error } = await supabase.from('Students').update(input).eq('uuid', uuid).select().single()
  const requestError = dataError(error)
  if (requestError) throw requestError
  return data as Student
}

export async function deleteStudent(uuid: string) {
  if (!supabase) {
    const data = readDemoData()
    writeDemoData({ ...data, students: data.students.filter((item) => item.uuid !== uuid), attendance: data.attendance.filter((item) => item.student_id !== uuid) })
    return
  }
  const { error } = await supabase.from('Students').delete().eq('uuid', uuid)
  const requestError = dataError(error)
  if (requestError) throw requestError
}

export async function createCourse(input: Omit<Course, 'uuid' | 'created_at'>): Promise<Course> {
  if (!supabase) {
    const data = readDemoData()
    const course: Course = { ...input, uuid: localId('course'), created_at: new Date().toISOString() }
    writeDemoData({ ...data, courses: [course, ...data.courses] })
    return course
  }
  const { data, error } = await supabase.from('Courses').insert(input).select().single()
  const requestError = dataError(error)
  if (requestError) throw requestError
  return data as Course
}

export async function updateCourse(uuid: string, input: Omit<Course, 'uuid' | 'created_at'>): Promise<Course> {
  if (!supabase) {
    const data = readDemoData()
    const course = { ...data.courses.find((item) => item.uuid === uuid), ...input, uuid } as Course
    writeDemoData({ ...data, courses: data.courses.map((item) => (item.uuid === uuid ? course : item)) })
    return course
  }
  const { data, error } = await supabase.from('Courses').update(input).eq('uuid', uuid).select().single()
  const requestError = dataError(error)
  if (requestError) throw requestError
  return data as Course
}

export async function deleteCourse(uuid: string) {
  if (!supabase) {
    const data = readDemoData()
    writeDemoData({ ...data, courses: data.courses.filter((item) => item.uuid !== uuid), attendance: data.attendance.filter((item) => item.course !== uuid) })
    return
  }
  const { error } = await supabase.from('Courses').delete().eq('uuid', uuid)
  const requestError = dataError(error)
  if (requestError) throw requestError
}

export async function saveAttendance(input: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
  if (!supabase) {
    const data = readDemoData()
    const existing = data.attendance.find((item) => item.student_id === input.student_id && item.course === input.course && item.date === input.date)
    const record: AttendanceRecord = existing ? { ...existing, ...input } : { ...input, id: Date.now() + Math.round(Math.random() * 1000) }
    const attendance = existing ? data.attendance.map((item) => (item.id === existing.id ? record : item)) : [record, ...data.attendance]
    writeDemoData({ ...data, attendance })
    return record
  }

  const lookup = await supabase.from('Attendance').select('id').eq('student_id', input.student_id).eq('course', input.course).eq('date', input.date).maybeSingle()
  const lookupError = dataError(lookup.error)
  if (lookupError) throw lookupError

  if (lookup.data?.id !== undefined && lookup.data?.id !== null) {
    const { data, error } = await supabase.from('Attendance').update(input).eq('id', lookup.data.id).select().single()
    const requestError = dataError(error)
    if (requestError) throw requestError
    return data as AttendanceRecord
  }

  const { data, error } = await supabase.from('Attendance').insert(input).select().single()
  const requestError = dataError(error)
  if (requestError) throw requestError
  return data as AttendanceRecord
}

export const getAttendanceKey = (studentId: string, courseId: string, date: string) => `${studentId}::${courseId}::${date}`

export const formatDate = (date: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`))

export const formatShortDate = (date: string) => new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`))

export const dateInputValue = () => new Date().toISOString().slice(0, 10)
