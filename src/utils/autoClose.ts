import type { AppSettings, ClosedWeekInfo, DayRecordsMap } from '../types'
import { getHolidayOrClosureInfo } from './holidays'
import {
  addDays,
  getSemesterInfo,
  getSundayForDate,
  getSundayWeekKey,
  isWeekend,
} from './dateUtils'

export interface ProcessAutoCloseParams {
  today: string // YYYY-MM-DD in Europe/Lisbon
  records: DayRecordsMap
  settings: AppSettings
  closedWeeks: Record<string, ClosedWeekInfo>
  firstUsedWeekKey: string | null
}

export interface ProcessAutoCloseResult {
  updatedRecords: DayRecordsMap
  updatedClosedWeeks: Record<string, ClosedWeekInfo>
  newlyClosedWeeks: ClosedWeekInfo[]
  effectiveFirstUsedWeekKey: string
  totalAutoClosedDays: number
  summaryMessage: string | null
}

/**
 * Executes automatic weekly closing on Saturdays (or next app open for pending weeks).
 *
 * Rules:
 * - Weeks run from Sunday to Saturday.
 * - On Saturday (or later), reviews working days of the finishing week.
 * - Any unrecorded day or day with only a plan suggestion ('plan') is registered as Telework ('auto_closed').
 * - Preserves manual records (Office, Vacation, manual Telework).
 * - Excludes weekends, official holidays, and company closures.
 * - Applies even to habitual office days (Seg/Qui).
 * - On first use, only reviews current week and onward.
 * - If initial balance exists, ignores dates up to cut-off date (inclusive).
 * - Preserves already closed weeks so manual corrections after closing remain intact.
 */
export function processAutoCloseWeeks({
  today,
  records,
  settings,
  closedWeeks,
  firstUsedWeekKey,
}: ProcessAutoCloseParams): ProcessAutoCloseResult {
  const currentWeekSunday = getSundayForDate(today)
  const currentWeekKey = getSundayWeekKey(today)

  // On first use, anchor to current week
  const effectiveFirstUsedWeekKey = firstUsedWeekKey || currentWeekKey
  const startSunday = effectiveFirstUsedWeekKey.replace('week-', '')

  const updatedRecords: DayRecordsMap = { ...records }
  const updatedClosedWeeks: Record<string, ClosedWeekInfo> = { ...closedWeeks }
  const newlyClosedWeeks: ClosedWeekInfo[] = []
  let totalAutoClosedDays = 0

  let iterSunday = startSunday

  // Iterate over weeks from startSunday up to currentWeekSunday
  while (iterSunday <= currentWeekSunday) {
    const iterWeekKey = `week-${iterSunday}`
    const iterSaturday = addDays(iterSunday, 6)

    // A week can only be closed once it has reached Saturday (today >= iterSaturday)
    if (today >= iterSaturday) {
      // Check if this week was already closed
      if (!updatedClosedWeeks[iterWeekKey]) {
        const autoClosedDates: string[] = []

        // Review all days in the week from Sunday to Saturday
        let iterDay = iterSunday
        while (iterDay <= iterSaturday) {
          // Exclude weekends (Saturday and Sunday)
          if (!isWeekend(iterDay)) {
            // Exclude holidays and closures
            const hInfo = getHolidayOrClosureInfo(iterDay, settings.customDates)
            if (!hInfo.isHoliday && !hInfo.isClosure) {
              // Check cut-off date for this day's semester
              const semester = getSemesterInfo(iterDay)
              const initBalance = settings.initialBalances?.[semester.key]
              const hasCutOff = !!(
                initBalance &&
                initBalance.enabled &&
                initBalance.cutOffDate
              )

              // Ignore dates up to cut-off date, inclusive
              const isCoveredByCutOff = hasCutOff && iterDay <= initBalance.cutOffDate!

              if (!isCoveredByCutOff) {
                const existing = updatedRecords[iterDay]

                // If unrecorded or only a plan suggestion, register as Telework
                if (!existing || existing.source === 'plan') {
                  updatedRecords[iterDay] = {
                    date: iterDay,
                    type: 'telework',
                    source: 'auto_closed',
                    updatedAt: new Date().toISOString(),
                  }
                  autoClosedDates.push(iterDay)
                }
                // If existing.source === 'manual', preserve completely!
              }
            }
          }

          iterDay = addDays(iterDay, 1)
        }

        const closedInfo: ClosedWeekInfo = {
          weekKey: iterWeekKey,
          saturdayDate: iterSaturday,
          closedAt: new Date().toISOString(),
          autoClosedDates,
          count: autoClosedDates.length,
        }

        updatedClosedWeeks[iterWeekKey] = closedInfo
        newlyClosedWeeks.push(closedInfo)
        totalAutoClosedDays += autoClosedDates.length
      }
    }

    iterSunday = addDays(iterSunday, 7)
  }

  let summaryMessage: string | null = null
  if (newlyClosedWeeks.length > 0) {
    const dayLabel = totalAutoClosedDays === 1 ? '1 dia registado' : `${totalAutoClosedDays} dias registados`
    const prefix = newlyClosedWeeks.length > 1 ? 'Semanas concluídas' : 'Semana concluída'
    summaryMessage = `${prefix} · ${dayLabel} como teletrabalho`
  }

  return {
    updatedRecords,
    updatedClosedWeeks,
    newlyClosedWeeks,
    effectiveFirstUsedWeekKey,
    totalAutoClosedDays,
    summaryMessage,
  }
}
