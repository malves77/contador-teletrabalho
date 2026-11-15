import type {
  AppSettings,
  ClosedWeekInfo,
  CustomDateItem,
  DayRecord,
  DayRecordsMap,
  InitialBalance,
} from '../types'

export const BACKUP_FORMAT = 'contador-teletrabalho-backup'
export const BACKUP_VERSION = 1
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024

export interface BackupData {
  settings: AppSettings
  records: DayRecordsMap
  closedWeeks: Record<string, ClosedWeekInfo>
  firstUsedWeekKey: string | null
}

export interface BackupFile extends BackupData {
  format: typeof BACKUP_FORMAT
  version: number
  exportedAt: string
}

export interface BackupSummary {
  semesters: number
  semesterKeys: string[]
  records: number
  closedWeeks: number
  customDates: number
}

export type BackupValidation =
  | { ok: true; data: BackupData; exportedAt: string; summary: BackupSummary }
  | { ok: false; reason: 'invalid' | 'incompatible' | 'too_large'; message: string }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const SEMESTER_RE = /^(\d{4})-S([12])$/
const WEEK_RE = /^week-\d{4}-\d{2}-\d{2}$/
const RECORD_TYPES = ['office', 'telework', 'vacation']
const RECORD_SOURCES = ['manual', 'plan', 'auto_closed']

export function isValidISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export function semesterKeyOfDate(date: string): string {
  const [y, m] = date.split('-').map(Number)
  return `${y}-S${m <= 6 ? 1 : 2}`
}

export function summarizeBackup(data: BackupData): BackupSummary {
  const keys = new Set<string>()
  for (const date of Object.keys(data.records)) keys.add(semesterKeyOfDate(date))
  for (const key of Object.keys(data.settings.initialBalances)) keys.add(key)
  const semesterKeys = [...keys].sort()
  return {
    semesters: semesterKeys.length,
    semesterKeys,
    records: Object.keys(data.records).length,
    closedWeeks: Object.keys(data.closedWeeks).length,
    customDates: data.settings.customDates.length,
  }
}

export function hasExistingData(data: BackupData): boolean {
  return (
    Object.keys(data.records).length > 0 ||
    Object.keys(data.closedWeeks).length > 0 ||
    Object.keys(data.settings.initialBalances).length > 0 ||
    data.settings.customDates.length > 0
  )
}

export function buildBackup(data: BackupData, now: Date = new Date()): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    settings: data.settings,
    records: data.records,
    closedWeeks: data.closedWeeks,
    firstUsedWeekKey: data.firstUsedWeekKey,
  }
}

export function backupFileName(todayLisbon: string): string {
  return `contador-teletrabalho-${todayLisbon}.json`
}

const invalid = (message: string): BackupValidation => ({ ok: false, reason: 'invalid', message })

function parseSettings(raw: unknown): AppSettings | string {
  if (!isObject(raw)) return 'Definições em falta ou inválidas.'
  const { quota, habitualOfficeDays, initialBalances, customDates } = raw

  if (typeof quota !== 'number' || !Number.isInteger(quota) || quota < 0 || quota > 366) {
    return 'Quota inválida.'
  }
  if (
    !Array.isArray(habitualOfficeDays) ||
    habitualOfficeDays.some((d) => !Number.isInteger(d) || (d as number) < 1 || (d as number) > 5) ||
    new Set(habitualOfficeDays).size !== habitualOfficeDays.length
  ) {
    return 'Dias habituais de escritório inválidos.'
  }
  if (!isObject(initialBalances)) return 'Saldos iniciais inválidos.'
  const balances: Record<string, InitialBalance> = {}
  for (const [key, value] of Object.entries(initialBalances)) {
    if (!SEMESTER_RE.test(key)) return `Semestre inválido nos saldos iniciais: ${key}.`
    if (!isObject(value)) return `Saldo inicial inválido em ${key}.`
    const { usedDays, cutOffDate, enabled } = value
    if (typeof usedDays !== 'number' || !Number.isInteger(usedDays) || usedDays < 0 || usedDays > 366) {
      return `Dias usados inválidos em ${key}.`
    }
    if (typeof enabled !== 'boolean') return `Estado do saldo inicial inválido em ${key}.`
    if (enabled && !isValidISODate(cutOffDate)) return `Data de corte inválida em ${key}.`
    if (!enabled && cutOffDate !== '' && !isValidISODate(cutOffDate)) {
      return `Data de corte inválida em ${key}.`
    }
    balances[key] = { usedDays, cutOffDate: cutOffDate as string, enabled }
  }
  if (!Array.isArray(customDates)) return 'Feriados e encerramentos inválidos.'
  const dates: CustomDateItem[] = []
  for (const item of customDates) {
    if (
      !isObject(item) ||
      typeof item.id !== 'string' ||
      !isValidISODate(item.date) ||
      typeof item.name !== 'string' ||
      (item.type !== 'holiday' && item.type !== 'closure')
    ) {
      return 'Feriado adicional ou encerramento inválido.'
    }
    dates.push({ id: item.id, date: item.date, name: item.name, type: item.type })
  }
  return {
    quota,
    habitualOfficeDays: habitualOfficeDays as number[],
    initialBalances: balances,
    customDates: dates,
  }
}

function parseRecords(raw: unknown): DayRecordsMap | string {
  if (!isObject(raw)) return 'Registos em falta ou inválidos.'
  const records: DayRecordsMap = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!isValidISODate(key)) return `Data de registo inválida: ${key}.`
    if (!isObject(value) || value.date !== key) return `Registo inconsistente em ${key}.`
    if (typeof value.type !== 'string' || !RECORD_TYPES.includes(value.type)) {
      return `Tipo de registo inválido em ${key}.`
    }
    if (
      value.source !== undefined &&
      (typeof value.source !== 'string' || !RECORD_SOURCES.includes(value.source))
    ) {
      return `Origem de registo inválida em ${key}.`
    }
    if (value.updatedAt !== undefined && typeof value.updatedAt !== 'string') {
      return `Data de atualização inválida em ${key}.`
    }
    const record: DayRecord = { date: key, type: value.type as DayRecord['type'] }
    if (value.source !== undefined) record.source = value.source as DayRecord['source']
    if (value.updatedAt !== undefined) record.updatedAt = value.updatedAt
    records[key] = record
  }
  return records
}

function parseClosedWeeks(raw: unknown): Record<string, ClosedWeekInfo> | string {
  if (!isObject(raw)) return 'Semanas fechadas em falta ou inválidas.'
  const weeks: Record<string, ClosedWeekInfo> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!WEEK_RE.test(key) || !isValidISODate(key.replace('week-', ''))) {
      return `Semana fechada inválida: ${key}.`
    }
    if (
      !isObject(value) ||
      value.weekKey !== key ||
      !isValidISODate(value.saturdayDate) ||
      typeof value.closedAt !== 'string' ||
      !Array.isArray(value.autoClosedDates) ||
      !value.autoClosedDates.every(isValidISODate) ||
      typeof value.count !== 'number' ||
      !Number.isInteger(value.count) ||
      value.count < 0
    ) {
      return `Semana fechada inconsistente: ${key}.`
    }
    weeks[key] = {
      weekKey: key,
      saturdayDate: value.saturdayDate,
      closedAt: value.closedAt,
      autoClosedDates: value.autoClosedDates as string[],
      count: value.count,
    }
  }
  return weeks
}

/** Valida o ficheiro inteiro. Nunca altera dados. */
export function validateBackupText(text: string, sizeBytes?: number): BackupValidation {
  if ((sizeBytes ?? text.length) > MAX_BACKUP_BYTES) {
    return {
      ok: false,
      reason: 'too_large',
      message: 'O ficheiro é demasiado grande para ser uma cópia de segurança.',
    }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return invalid('O ficheiro não é um JSON válido.')
  }
  if (!isObject(parsed) || parsed.format !== BACKUP_FORMAT) {
    return invalid('Este ficheiro não é uma cópia de segurança do Contador de Teletrabalho.')
  }
  const version = parsed.version
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return invalid('A versão da cópia de segurança é inválida.')
  }
  if (version > BACKUP_VERSION) {
    return {
      ok: false,
      reason: 'incompatible',
      message: `Versão incompatível (${version}). Esta app só importa a versão ${BACKUP_VERSION}. Atualize a app e tente novamente.`,
    }
  }
  if (typeof parsed.exportedAt !== 'string') return invalid('Data de exportação em falta.')

  const settings = parseSettings(parsed.settings)
  if (typeof settings === 'string') return invalid(settings)
  const records = parseRecords(parsed.records)
  if (typeof records === 'string') return invalid(records)
  const closedWeeks = parseClosedWeeks(parsed.closedWeeks)
  if (typeof closedWeeks === 'string') return invalid(closedWeeks)

  const first = parsed.firstUsedWeekKey
  if (
    first !== null &&
    (typeof first !== 'string' || !WEEK_RE.test(first) || !isValidISODate(first.replace('week-', '')))
  ) {
    return invalid('Primeira semana de utilização inválida.')
  }

  const data: BackupData = { settings, records, closedWeeks, firstUsedWeekKey: first as string | null }
  return { ok: true, data, exportedAt: parsed.exportedAt, summary: summarizeBackup(data) }
}

/** Descarrega o ficheiro (funciona offline). */
export function downloadBackup(file: BackupFile, fileName: string): void {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function canShareBackup(file: BackupFile, fileName: string): boolean {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function' || typeof File === 'undefined') {
      return false
    }
    const f = new File([JSON.stringify(file)], fileName, { type: 'application/json' })
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [f] })
  } catch {
    return false
  }
}

export async function shareBackup(
  file: BackupFile,
  fileName: string
): Promise<'shared' | 'cancelled' | 'failed'> {
  try {
    const f = new File([JSON.stringify(file, null, 2)], fileName, { type: 'application/json' })
    await navigator.share({ files: [f], title: 'Cópia de segurança · Contador de Teletrabalho' })
    return 'shared'
  } catch (e) {
    return e instanceof DOMException && e.name === 'AbortError' ? 'cancelled' : 'failed'
  }
}
