import type { AppSettings, BalanceMetrics, DayRecordsMap, SemesterInfo } from '../types'

/**
 * Calculates telework balance metrics for a given semester according to the rules:
 * - Dias usados: Dias do saldo inicial (se existir) + registos de teletrabalho até hoje que ainda não estejam incluídos nesse saldo (posteriores à data de corte).
 * - Dias planeados: Registos de teletrabalho com data posterior a hoje.
 * - Saldo atual: Quota - Dias usados.
 * - Saldo após o plano: Saldo atual - Dias planeados.
 * - Limite excedido: se (usados + planeados) > quota, quantos dias ficam acima do limite.
 */
export function calculateSemesterBalance(
  semester: SemesterInfo,
  records: DayRecordsMap,
  settings: AppSettings,
  today: string
): BalanceMetrics {
  const quota = settings.quota ?? 60
  const initial = settings.initialBalances?.[semester.key]
  const hasInitial = !!(initial && initial.enabled && typeof initial.usedDays === 'number' && initial.cutOffDate)

  // Get all telework records for the semester
  const teleworkInSemester: string[] = []
  for (const [date, record] of Object.entries(records)) {
    if (record.type === 'telework' && date >= semester.startDate && date <= semester.endDate) {
      teleworkInSemester.push(date)
    }
  }

  let usedDays = 0

  if (hasInitial) {
    const cutOff = initial.cutOffDate
    // Base is initial.usedDays (covers all telework up to and including cutOffDate)
    const baseUsed = initial.usedDays
    // Only add telework records strictly after cut-off date and on or before today
    const postCutOffUsed = teleworkInSemester.filter((date) => date > cutOff && date <= today).length
    usedDays = baseUsed + postCutOffUsed
  } else {
    // No initial balance: count all telework up to and including today
    usedDays = teleworkInSemester.filter((date) => date <= today).length
  }

  // Planned days: telework records after today in this semester
  const plannedDays = teleworkInSemester.filter((date) => date > today).length

  const currentBalance = quota - usedDays
  const afterPlanBalance = currentBalance - plannedDays
  const totalTelework = usedDays + plannedDays
  const isOverQuota = totalTelework > quota
  const overQuotaDays = isOverQuota ? totalTelework - quota : 0

  return {
    quota,
    usedDays,
    plannedDays,
    currentBalance,
    afterPlanBalance,
    isOverQuota,
    overQuotaDays,
  }
}
