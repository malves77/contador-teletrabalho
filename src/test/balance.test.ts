import { describe, it, expect } from 'vitest'
import { calculateSemesterBalance } from '../utils/balance'
import { getSemesterInfo } from '../utils/dateUtils'
import type { AppSettings, DayRecordsMap } from '../types'

describe('Cálculo de Saldo e Data de Corte', () => {
  it('com a data fixada em 31 de outubro de 2026, uma quota de 60 e 42 dias usados até essa data, o saldo é 18. Um registo a 30 de outubro não altera o saldo. Um teletrabalho registado a 3 de novembro mantém o saldo atual em 18 e reduz o saldo após o plano para 17. A partir de 3 de novembro, esse teletrabalho passa para os dias usados e o saldo atual passa para 17.', () => {
    const semester = getSemesterInfo('2026-10-31') // 2026-S2 (2026-07-01 a 2026-12-31)

    const baseSettings: AppSettings = {
      quota: 60,
      habitualOfficeDays: [1, 4],
      initialBalances: {
        '2026-S2': {
          usedDays: 42,
          cutOffDate: '2026-10-31',
          enabled: true,
        },
      },
      customDates: [],
    }

    const records: DayRecordsMap = {}

    // Cenário 1: Data fixada em 31 de outubro de 2026
    let today = '2026-10-31'
    let balance = calculateSemesterBalance(semester, records, baseSettings, today)

    expect(balance.quota).toBe(60)
    expect(balance.usedDays).toBe(42)
    expect(balance.plannedDays).toBe(0)
    expect(balance.currentBalance).toBe(18)
    expect(balance.afterPlanBalance).toBe(18)

    // Cenário 2: Um registo a 30 de outubro não altera o saldo (está dentro ou antes da data de corte)
    records['2026-10-30'] = { date: '2026-10-30', type: 'telework', source: 'manual' }
    balance = calculateSemesterBalance(semester, records, baseSettings, today)

    expect(balance.usedDays).toBe(42)
    expect(balance.currentBalance).toBe(18)
    expect(balance.afterPlanBalance).toBe(18)

    // Cenário 3: Um teletrabalho registado a 3 de novembro
    // Hoje ainda é 31 de outubro de 2026 -> 3 de novembro é posterior a hoje (planeado)
    records['2026-11-03'] = { date: '2026-11-03', type: 'telework', source: 'manual' }
    balance = calculateSemesterBalance(semester, records, baseSettings, today)

    // Mantém o saldo atual em 18 e reduz o saldo após o plano para 17
    expect(balance.usedDays).toBe(42)
    expect(balance.currentBalance).toBe(18)
    expect(balance.plannedDays).toBe(1)
    expect(balance.afterPlanBalance).toBe(17)

    // Cenário 4: A partir de 3 de novembro, esse teletrabalho passa para os dias usados e o saldo atual passa para 17
    today = '2026-11-03'
    balance = calculateSemesterBalance(semester, records, baseSettings, today)

    expect(balance.usedDays).toBe(43)
    expect(balance.plannedDays).toBe(0)
    expect(balance.currentBalance).toBe(17)
    expect(balance.afterPlanBalance).toBe(17)
  })

  it('indica quando os registos ultrapassam a quota', () => {
    const semester = getSemesterInfo('2026-10-31')
    const settings: AppSettings = {
      quota: 60,
      habitualOfficeDays: [1, 4],
      initialBalances: {
        '2026-S2': {
          usedDays: 58,
          cutOffDate: '2026-10-31',
          enabled: true,
        },
      },
      customDates: [],
    }

    const records: DayRecordsMap = {
      '2026-11-03': { date: '2026-11-03', type: 'telework' },
      '2026-11-04': { date: '2026-11-04', type: 'telework' },
      '2026-11-05': { date: '2026-11-05', type: 'telework' },
      '2026-11-06': { date: '2026-11-06', type: 'telework' },
    }

    const balance = calculateSemesterBalance(semester, records, settings, '2026-10-31')
    // 58 usados + 4 planeados = 62 teletrabalho (ultrapassa em 2)
    expect(balance.usedDays).toBe(58)
    expect(balance.plannedDays).toBe(4)
    expect(balance.isOverQuota).toBe(true)
    expect(balance.overQuotaDays).toBe(2)
    expect(balance.currentBalance).toBe(2)
    expect(balance.afterPlanBalance).toBe(-2)
  })
})
