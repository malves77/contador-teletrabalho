import type { CustomDateItem } from '../types'
import { formatISODate, splitISODate } from './dateUtils'

/**
 * Calculates Western Easter Sunday for a given year using Meeus/Jones/Butcher algorithm.
 */
export function getEasterDate(year: number): { month: number; day: number } {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { month, day }
}

/**
 * Helper to add days to a UTC month/day.
 */
function offsetDate(year: number, month: number, day: number, offsetDays: number): { month: number; day: number } {
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return {
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  }
}

/**
 * Returns all national Portuguese holidays + Lisbon municipal holiday (13 de junho) for a given year.
 * Returns map of YYYY-MM-DD -> holiday name.
 */
export function getOfficialHolidaysForYear(year: number): Record<string, string> {
  const holidays: Record<string, string> = {}

  // Fixed National Holidays
  holidays[formatISODate(year, 1, 1)] = 'Ano Novo'
  holidays[formatISODate(year, 4, 25)] = 'Dia da Liberdade'
  holidays[formatISODate(year, 5, 1)] = 'Dia do Trabalhador'
  holidays[formatISODate(year, 6, 10)] = 'Dia de Portugal'
  holidays[formatISODate(year, 8, 15)] = 'Assunção de Nossa Senhora'
  holidays[formatISODate(year, 10, 5)] = 'Implantação da República'
  holidays[formatISODate(year, 11, 1)] = 'Todos os Santos'
  holidays[formatISODate(year, 12, 1)] = 'Restauração da Independência'
  holidays[formatISODate(year, 12, 8)] = 'Imaculada Conceição'
  holidays[formatISODate(year, 12, 25)] = 'Natal'

  // Municipal Holiday of Lisbon
  holidays[formatISODate(year, 6, 13)] = 'Santo António (Feriado de Lisboa)'

  // Moveable Holidays based on Easter
  const easter = getEasterDate(year)

  // Carnaval / Terça-feira de Carnaval: Easter - 47 days
  const carnival = offsetDate(year, easter.month, easter.day, -47)
  holidays[formatISODate(year, carnival.month, carnival.day)] = 'Carnaval'

  // Sexta-feira Santa: Easter - 2 days
  const goodFriday = offsetDate(year, easter.month, easter.day, -2)
  holidays[formatISODate(year, goodFriday.month, goodFriday.day)] = 'Sexta-feira Santa'

  // Domingo de Páscoa
  holidays[formatISODate(year, easter.month, easter.day)] = 'Páscoa'

  // Corpo de Deus: Easter + 60 days
  const corpusChristi = offsetDate(year, easter.month, easter.day, 60)
  holidays[formatISODate(year, corpusChristi.month, corpusChristi.day)] = 'Corpo de Deus'

  return holidays
}

/**
 * Checks if a date is an official holiday, custom holiday, or company closure.
 */
export function getHolidayOrClosureInfo(
  dateStr: string,
  customDates: CustomDateItem[] = []
): {
  isHoliday: boolean
  holidayName?: string
  isClosure: boolean
  closureName?: string
} {
  const { year } = splitISODate(dateStr)
  const officialHolidays = getOfficialHolidaysForYear(year)

  let isHoliday = false
  let holidayName: string | undefined
  let isClosure = false
  let closureName: string | undefined

  if (officialHolidays[dateStr]) {
    isHoliday = true
    holidayName = officialHolidays[dateStr]
  }

  // Check custom dates
  for (const item of customDates) {
    if (item.date === dateStr) {
      if (item.type === 'holiday') {
        isHoliday = true
        holidayName = item.name || 'Feriado adicional'
      } else if (item.type === 'closure') {
        isClosure = true
        closureName = item.name || 'Encerramento da empresa'
      }
    }
  }

  return { isHoliday, holidayName, isClosure, closureName }
}
