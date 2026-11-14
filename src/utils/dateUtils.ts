import type { SemesterInfo } from '../types'

/**
 * Returns today's date in Europe/Lisbon timezone as YYYY-MM-DD.
 */
export function getTodayLisbon(referenceDate: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(referenceDate)
}

/**
 * Formats year, month (1-12), and day (1-31) as YYYY-MM-DD.
 */
export function formatISODate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0')
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Splits a YYYY-MM-DD string into numeric components without timezone shifting.
 */
export function splitISODate(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-')
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10),
    day: parseInt(parts[2], 10),
  }
}

/**
 * Adds or subtracts days from a YYYY-MM-DD string.
 */
export function addDays(dateStr: string, days: number): string {
  const { year, month, day } = splitISODate(dateStr)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return formatISODate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

/**
 * Returns day of week with Sunday first: 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 */
export function getDayOfWeekSundayFirst(dateStr: string): number {
  const { year, month, day } = splitISODate(dateStr)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCDay()
}

/**
 * Returns ISO day of week: 1 = Monday, 2 = Tuesday, ..., 7 = Sunday.
 */
export function getDayOfWeek(dateStr: string): number {
  const { year, month, day } = splitISODate(dateStr)
  const date = new Date(Date.UTC(year, month - 1, day))
  const dayIndex = date.getUTCDay() // 0 = Sunday, 1 = Monday, ...
  return dayIndex === 0 ? 7 : dayIndex
}

/**
 * Returns true if the date is Saturday (6) or Sunday (7).
 */
export function isWeekend(dateStr: string): boolean {
  const dow = getDayOfWeek(dateStr)
  return dow === 6 || dow === 7
}

/**
 * Returns SemesterInfo for a given date or year+semester.
 */
export function getSemesterInfo(dateOrYear: string | number, semesterParam?: 1 | 2): SemesterInfo {
  let year: number
  let semester: 1 | 2

  if (typeof dateOrYear === 'number') {
    year = dateOrYear
    semester = semesterParam || 1
  } else {
    const { year: y, month: m } = splitISODate(dateOrYear)
    year = y
    semester = m <= 6 ? 1 : 2
  }

  const key = `${year}-S${semester}`
  const label = `${semester}º Semestre ${year} (${semester === 1 ? 'Jan - Jun' : 'Jul - Dez'})`
  const startDate = semester === 1 ? `${year}-01-01` : `${year}-07-01`
  const endDate = semester === 1 ? `${year}-06-30` : `${year}-12-31`

  return {
    year,
    semester,
    key,
    label,
    startDate,
    endDate,
  }
}

/**
 * Moves one semester back (-1) or forward (+1).
 */
export function getAdjacentSemester(semester: SemesterInfo, direction: -1 | 1): SemesterInfo {
  if (direction === 1) {
    if (semester.semester === 1) {
      return getSemesterInfo(semester.year, 2)
    }
    return getSemesterInfo(semester.year + 1, 1)
  } else {
    if (semester.semester === 2) {
      return getSemesterInfo(semester.year, 1)
    }
    return getSemesterInfo(semester.year - 1, 2)
  }
}

/**
 * Returns the 6 months belonging to the semester (1-based month numbers 1-6 or 7-12).
 */
export function getMonthsInSemester(semester: SemesterInfo): { year: number; month: number }[] {
  const startMonth = semester.semester === 1 ? 1 : 7
  const months: { year: number; month: number }[] = []
  for (let m = startMonth; m < startMonth + 6; m++) {
    months.push({ year: semester.year, month: m })
  }
  return months
}

export const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export const DAY_NAMES_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export const DAY_NAMES_FULL_PT: Record<number, string> = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
  7: 'Domingo',
}

/**
 * Returns the localized Portuguese name of the month (1-based: 1 = Janeiro, 12 = Dezembro).
 */
export function getMonthNamePT(month: number): string {
  return MONTH_NAMES_PT[month - 1] || ''
}

/**
 * Returns how many days are in a given year and month.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/**
 * Returns all dates of a month as YYYY-MM-DD.
 */
export function getMonthDays(year: number, month: number): string[] {
  const totalDays = getDaysInMonth(year, month)
  const days: string[] = []
  for (let d = 1; d <= totalDays; d++) {
    days.push(formatISODate(year, month, d))
  }
  return days
}

/**
 * Formats date for display in Portuguese: e.g. "14 de novembro de 2026".
 */
export function formatDatePT(dateStr: string): string {
  const { year, month, day } = splitISODate(dateStr)
  return `${day} de ${MONTH_NAMES_PT[month - 1]?.toLowerCase()} de ${year}`
}

/**
 * Formats date with weekday: e.g. "Sábado, 14 de novembro de 2026".
 */
export function formatDateWithWeekdayPT(dateStr: string): string {
  const dow = getDayOfWeek(dateStr)
  const dayName = DAY_NAMES_FULL_PT[dow]
  return `${dayName}, ${formatDatePT(dateStr)}`
}

/**
 * Returns the ISO date (YYYY-MM-DD) of the Sunday that starts the week (Sunday..Saturday) containing dateStr.
 */
export function getSundayForDate(dateStr: string): string {
  const { year, month, day } = splitISODate(dateStr)
  const date = new Date(Date.UTC(year, month - 1, day))
  const dowSundayFirst = date.getUTCDay() // 0 = Sunday ... 6 = Saturday
  date.setUTCDate(date.getUTCDate() - dowSundayFirst)
  const sundayYear = date.getUTCFullYear()
  const sundayMonth = date.getUTCMonth() + 1
  const sundayDay = date.getUTCDate()
  return formatISODate(sundayYear, sundayMonth, sundayDay)
}

/**
 * Returns the ISO date (YYYY-MM-DD) of the Saturday that ends the week starting on weekSundayDateStr.
 */
export function getSaturdayForWeek(weekSundayDateStr: string): string {
  return addDays(weekSundayDateStr, 6)
}

/**
 * Returns a week key for a week starting on Sunday and ending on Saturday.
 * Uses the ISO date string of the Sunday that starts the week.
 * E.g. for Saturday 2026-11-21, returns "week-2026-11-15".
 * For Sunday 2026-11-22, returns "week-2026-11-22" (different week).
 */
export function getSundayWeekKey(dateStr: string): string {
  const sundayStr = getSundayForDate(dateStr)
  return `week-${sundayStr}`
}

/**
 * Returns the ISO week key string (e.g. "2026-W45") for grouping days by week.
 */
export function getIsoWeekKey(dateStr: string): string {
  const { year, month, day } = splitISODate(dateStr)
  const date = new Date(Date.UTC(year, month - 1, day))
  const dayNr = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - dayNr + 3)
  const firstThursday = date.getTime()
  date.setUTCMonth(0, 1)
  if (date.getUTCDay() !== 4) {
    date.setUTCMonth(0, 1 + ((4 - date.getUTCDay() + 7) % 7))
  }
  const weekNumber = 1 + Math.ceil((firstThursday - date.getTime()) / 604800000)
  return `${date.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}
