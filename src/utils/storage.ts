import type { AppSettings, ClosedWeekInfo, DayRecordsMap } from '../types'

export const STORAGE_KEYS = {
  SETTINGS: 'contador_teletrabalho_settings',
  RECORDS: 'contador_teletrabalho_records',
  CLOSED_WEEKS: 'contador_teletrabalho_closed_weeks',
  FIRST_USED_WEEK: 'contador_teletrabalho_first_used_week',
}

export const DEFAULT_SETTINGS: AppSettings = {
  quota: 60,
  habitualOfficeDays: [1, 4], // 1 = Segunda-feira, 4 = Quinta-feira
  initialBalances: {},
  customDates: [],
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw)
    return {
      quota: typeof parsed.quota === 'number' ? parsed.quota : DEFAULT_SETTINGS.quota,
      habitualOfficeDays: Array.isArray(parsed.habitualOfficeDays)
        ? parsed.habitualOfficeDays
        : DEFAULT_SETTINGS.habitualOfficeDays,
      initialBalances: parsed.initialBalances && typeof parsed.initialBalances === 'object'
        ? parsed.initialBalances
        : {},
      customDates: Array.isArray(parsed.customDates) ? parsed.customDates : [],
    }
  } catch (e) {
    console.error('Erro ao carregar definições do localStorage:', e)
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  } catch (e) {
    console.error('Erro ao guardar definições no localStorage:', e)
  }
}

export function loadRecords(): DayRecordsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch (e) {
    console.error('Erro ao carregar registos do localStorage:', e)
    return {}
  }
}

export function saveRecords(records: DayRecordsMap): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records))
  } catch (e) {
    console.error('Erro ao guardar registos no localStorage:', e)
  }
}

export function loadClosedWeeks(): Record<string, ClosedWeekInfo> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLOSED_WEEKS)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch (e) {
    console.error('Erro ao carregar semanas fechadas do localStorage:', e)
    return {}
  }
}

export function saveClosedWeeks(closedWeeks: Record<string, ClosedWeekInfo>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CLOSED_WEEKS, JSON.stringify(closedWeeks))
  } catch (e) {
    console.error('Erro ao guardar semanas fechadas no localStorage:', e)
  }
}

export function loadFirstUsedWeek(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.FIRST_USED_WEEK)
  } catch (e) {
    console.error('Erro ao carregar primeira semana de utilização do localStorage:', e)
    return null
  }
}

export function saveFirstUsedWeek(weekKey: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FIRST_USED_WEEK, weekKey)
  } catch (e) {
    console.error('Erro ao guardar primeira semana de utilização no localStorage:', e)
  }
}
