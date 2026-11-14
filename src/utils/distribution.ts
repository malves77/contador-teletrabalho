import type { AppSettings, BalanceMetrics, DayRecordsMap, PlanDistributionResult, SemesterInfo } from '../types'
import { addDays, getDayOfWeek, getSundayWeekKey, isWeekend } from './dateUtils'
import { getHolidayOrClosureInfo } from './holidays'

/**
 * Generates proposed telework dates to distribute remaining balance evenly across weeks.
 */
export function generateTeleworkPlan(
  semester: SemesterInfo,
  records: DayRecordsMap,
  settings: AppSettings,
  balanceMetrics: BalanceMetrics,
  today: string
): PlanDistributionResult {
  const availableDays = balanceMetrics.afterPlanBalance

  if (availableDays <= 0) {
    return {
      proposedDates: [],
      unallocatedDays: 0,
      balanceAfterPlan: availableDays,
    }
  }

  // Determine date search range:
  // "Para o semestre selecionado, procura datas entre amanhã e o fim do semestre.
  // Num semestre futuro, começa na primeira data desse semestre."
  let startDate: string

  if (today < semester.startDate) {
    // Future semester
    startDate = semester.startDate
  } else if (today >= semester.startDate && today <= semester.endDate) {
    // Current semester
    startDate = addDays(today, 1)
  } else {
    // Past semester
    return {
      proposedDates: [],
      unallocatedDays: availableDays,
      balanceAfterPlan: availableDays,
    }
  }

  const endDate = semester.endDate
  if (startDate > endDate) {
    return {
      proposedDates: [],
      unallocatedDays: availableDays,
      balanceAfterPlan: availableDays,
    }
  }

  // Collect all eligible dates
  const eligibleDates: string[] = []
  let curr = startDate

  while (curr <= endDate) {
    // Exclude weekends
    if (!isWeekend(curr)) {
      // Exclude holidays and company closures
      const holidayInfo = getHolidayOrClosureInfo(curr, settings.customDates)
      if (!holidayInfo.isHoliday && !holidayInfo.isClosure) {
        // Exclude habitual office days
        const dow = getDayOfWeek(curr)
        const isHabitualOffice = settings.habitualOfficeDays.includes(dow)
        if (!isHabitualOffice) {
          // Exclude dates already filled with any record (vacation, office, or telework)
          const existingRecord = records[curr]
          if (!existingRecord) {
            eligibleDates.push(curr)
          }
        }
      }
    }
    curr = addDays(curr, 1)
  }

  const daysToAllocate = Math.min(availableDays, eligibleDates.length)
  const unallocatedDays = Math.max(0, availableDays - eligibleDates.length)

  if (daysToAllocate === 0) {
    return {
      proposedDates: [],
      unallocatedDays,
      balanceAfterPlan: availableDays,
    }
  }

  // Group eligible dates by calendar week (Sunday to Saturday) to distribute as evenly as possible
  const weekMap = new Map<string, string[]>()
  for (const date of eligibleDates) {
    const weekKey = getSundayWeekKey(date)
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, [])
    }
    weekMap.get(weekKey)!.push(date)
  }

  const weekKeys = Array.from(weekMap.keys())
  const selectedDates: string[] = []
  let allocatedCount = 0

  // Round-robin over the weeks so each week gets 1 day before any week gets a 2nd day, etc.
  while (allocatedCount < daysToAllocate) {
    let pickedInRound = false

    for (const wKey of weekKeys) {
      if (allocatedCount >= daysToAllocate) break

      const availableInWeek = weekMap.get(wKey)
      if (availableInWeek && availableInWeek.length > 0) {
        const pickedDate = availableInWeek.shift()!
        selectedDates.push(pickedDate)
        allocatedCount++
        pickedInRound = true
      }
    }

    if (!pickedInRound) {
      break
    }
  }

  // Sort chronologically
  selectedDates.sort()

  const balanceAfterPlan = availableDays - selectedDates.length

  return {
    proposedDates: selectedDates,
    unallocatedDays,
    balanceAfterPlan,
  }
}
