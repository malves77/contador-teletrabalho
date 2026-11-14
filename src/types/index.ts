export type DayRecordType = 'office' | 'telework' | 'vacation'

export interface DayRecord {
  date: string // YYYY-MM-DD in Europe/Lisbon
  type: DayRecordType
  source?: 'manual' | 'plan' | 'auto_closed'
  updatedAt?: string
}

export type DayRecordsMap = Record<string, DayRecord> // Key is YYYY-MM-DD

export interface ClosedWeekInfo {
  weekKey: string // e.g. "week-2026-11-08"
  saturdayDate: string // e.g. "2026-11-14"
  closedAt: string
  autoClosedDates: string[]
  count: number
}

export interface AutoCloseSummary {
  message: string
  count: number
  closedWeeks: ClosedWeekInfo[]
}

export interface InitialBalance {
  usedDays: number
  cutOffDate: string // YYYY-MM-DD (includes cut-off day itself)
  enabled: boolean
}

export interface CustomDateItem {
  id: string
  date: string // YYYY-MM-DD
  name: string
  type: 'holiday' | 'closure'
}

export interface AppSettings {
  quota: number // Default: 60
  habitualOfficeDays: number[] // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri. Default: [1, 4] (Segunda e Quinta)
  initialBalances: Record<string, InitialBalance> // Key is semester key e.g. "2026-S1", "2026-S2"
  customDates: CustomDateItem[]
}

export interface SemesterInfo {
  year: number
  semester: 1 | 2
  key: string // e.g. "2026-S1", "2026-S2"
  label: string // e.g. "1º Semestre 2026 (Jan - Jun)"
  startDate: string // YYYY-01-01 or YYYY-07-01
  endDate: string // YYYY-06-30 or YYYY-12-31
}

export interface BalanceMetrics {
  quota: number
  usedDays: number
  plannedDays: number
  currentBalance: number
  afterPlanBalance: number
  isOverQuota: boolean
  overQuotaDays: number
}

export interface PlanDistributionResult {
  proposedDates: string[]
  unallocatedDays: number
  balanceAfterPlan: number
}

export interface DayClassification {
  date: string
  isWeekend: boolean
  isHoliday: boolean
  holidayName?: string
  isClosure: boolean
  closureName?: string
  isHabitualOffice: boolean
  isWorkingDay: boolean
  record?: DayRecord
}
