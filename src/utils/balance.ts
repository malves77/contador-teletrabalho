import type { AppSettings, BalanceMetrics, BalanceToleranceInfo, DayRecordsMap, SemesterInfo, ToleranceState } from '../types'

/**
 * Calculates the 15% tolerance status (rounded down to whole days) for used and planned days.
 */
export function calculateToleranceInfo(
  quota: number,
  usedDays: number,
  plannedDays: number
): BalanceToleranceInfo {
  const toleranceDays = Math.floor(Math.max(0, quota) * 0.15)
  const maxDaysWithTolerance = quota + toleranceDays

  let state: ToleranceState = 'within_quota'
  let isQuotaExhausted = false
  let isToleranceExhausted = false
  let usedToleranceDays = 0
  let overToleranceDays = 0
  let message = ''

  if (usedDays < quota) {
    const remaining = quota - usedDays
    message = `Dentro da quota · ${remaining} ${remaining === 1 ? 'dia disponível' : 'dias disponíveis'}`
  } else if (usedDays === quota) {
    isQuotaExhausted = true
    message =
      toleranceDays > 0
        ? `Quota esgotada · ${toleranceDays} ${toleranceDays === 1 ? 'dia de tolerância disponível' : 'dias de tolerância disponíveis'}`
        : 'Quota esgotada · sem dias de tolerância disponíveis'
  } else if (usedDays <= maxDaysWithTolerance) {
    state = 'within_tolerance'
    usedToleranceDays = usedDays - quota
    isToleranceExhausted = usedDays === maxDaysWithTolerance
    message = isToleranceExhausted
      ? `Tolerância esgotada · limite de ${maxDaysWithTolerance} dias atingido`
      : `Dentro da tolerância · ${usedToleranceDays} de ${toleranceDays} ${toleranceDays === 1 ? 'dia adicional usado' : 'dias adicionais usados'}`
  } else {
    state = 'over_tolerance'
    usedToleranceDays = toleranceDays
    overToleranceDays = usedDays - maxDaysWithTolerance
    message = `Tolerância ultrapassada · ${overToleranceDays} ${overToleranceDays === 1 ? 'dia' : 'dias'} acima do limite de ${maxDaysWithTolerance}`
  }

  let forecastState: ToleranceState | null = null
  let forecastMessage: string | null = null

  if (plannedDays > 0) {
    const totalProjected = usedDays + plannedDays
    if (totalProjected > maxDaysWithTolerance) {
      forecastState = 'over_tolerance'
      const forecastExcess = totalProjected - maxDaysWithTolerance
      forecastMessage =
        usedDays <= maxDaysWithTolerance
          ? `Previsão após plano · O plano futuro ultrapassa o limite de tolerância de ${maxDaysWithTolerance} dias em ${forecastExcess} ${forecastExcess === 1 ? 'dia' : 'dias'}.`
          : `Previsão após plano · Com os ${plannedDays} ${plannedDays === 1 ? 'dia planeado' : 'dias planeados'}, o total sobe para ${totalProjected} dias (${forecastExcess} ${forecastExcess === 1 ? 'dia' : 'dias'} acima do limite de ${maxDaysWithTolerance}).`
    } else if (totalProjected > quota) {
      forecastState = 'within_tolerance'
      const forecastTolUsed = totalProjected - quota
      forecastMessage =
        usedDays <= quota
          ? `Previsão após plano · O plano futuro entra na tolerância (${forecastTolUsed} de ${toleranceDays} ${toleranceDays === 1 ? 'dia adicional previsto' : 'dias adicionais previstos'}).`
          : `Previsão após plano · Com os ${plannedDays} ${plannedDays === 1 ? 'dia planeado' : 'dias planeados'}, o total previsto sobe para ${forecastTolUsed} de ${toleranceDays} ${toleranceDays === 1 ? 'dia adicional' : 'dias adicionais'}.`
    }
  }

  return {
    toleranceDays,
    maxDaysWithTolerance,
    state,
    isQuotaExhausted,
    isToleranceExhausted,
    usedToleranceDays,
    overToleranceDays,
    message,
    forecastState,
    forecastMessage,
  }
}

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
  const tolerance = calculateToleranceInfo(quota, usedDays, plannedDays)

  return {
    quota,
    usedDays,
    plannedDays,
    currentBalance,
    afterPlanBalance,
    isOverQuota,
    overQuotaDays,
    tolerance,
  }
}
