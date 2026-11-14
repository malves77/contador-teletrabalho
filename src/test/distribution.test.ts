import { describe, it, expect } from 'vitest'
import { generateTeleworkPlan } from '../utils/distribution'
import { calculateSemesterBalance } from '../utils/balance'
import { getSemesterInfo } from '../utils/dateUtils'
import type { AppSettings, DayRecordsMap } from '../types'

describe('Distribuição de dias restantes', () => {
  it('com férias a partir de 23 de dezembro de 2026, o plano exclui todas as datas a partir desse dia. Exclui também os feriados de 1 e 8 de dezembro.', () => {
    const semester = getSemesterInfo('2026-11-20') // 2026-S2 (2026-07-01 a 2026-12-31)
    const today = '2026-11-20'

    const settings: AppSettings = {
      quota: 60,
      habitualOfficeDays: [1, 4], // Segunda e Quinta são escritório habitual
      initialBalances: {},
      customDates: [],
    }

    // Registar férias de 23 de dezembro a 31 de dezembro de 2026
    const records: DayRecordsMap = {}
    const vacationDays = [
      '2026-12-23',
      '2026-12-24',
      '2026-12-25',
      '2026-12-26',
      '2026-12-27',
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
    ]
    for (const d of vacationDays) {
      records[d] = { date: d, type: 'vacation' }
    }

    const balance = calculateSemesterBalance(semester, records, settings, today)
    const plan = generateTeleworkPlan(semester, records, settings, balance, today)

    // O plano não deve incluir nenhuma data a partir de 23 de dezembro
    for (const proposedDate of plan.proposedDates) {
      expect(proposedDate < '2026-12-23').toBe(true)
    }

    // 1 de dezembro (Restauração da Independência) e 8 de dezembro (Imaculada Conceição) são feriados
    expect(plan.proposedDates).not.toContain('2026-12-01')
    expect(plan.proposedDates).not.toContain('2026-12-08')
  })

  it('quando há três datas elegíveis para cinco dias disponíveis, o plano propõe três e indica que dois ficarão por usar. Voltar a gerar o plano depois de o aplicar não cria duplicados nem substitui registos existentes.', () => {
    // Vamos configurar um semestre com quota de 5 e sem dias usados, restando 5 dias de saldo
    const semester = getSemesterInfo('2026-12-28') // 2026-S2
    const today = '2026-12-28' // Segunda-feira

    // No período de amanhã (2026-12-29) até ao fim do semestre (2026-12-31):
    // 2026-12-29: Terça-feira (elegível)
    // 2026-12-30: Quarta-feira (elegível)
    // 2026-12-31: Quinta-feira (habitual escritório se habitualOfficeDays=[1, 4]) -> não elegível
    // Para ter exatamente 3 datas elegíveis, definimos habitualOfficeDays = [1] (apenas Segundas)
    // Assim, 29 (Ter), 30 (Qua) e 31 (Qui) são elegíveis (3 datas elegíveis no total)
    const settings: AppSettings = {
      quota: 5,
      habitualOfficeDays: [1], // Segunda-feira
      initialBalances: {},
      customDates: [],
    }

    const records: DayRecordsMap = {}
    let balance = calculateSemesterBalance(semester, records, settings, today)
    expect(balance.afterPlanBalance).toBe(5) // 5 dias disponíveis

    // Gerar plano
    const plan = generateTeleworkPlan(semester, records, settings, balance, today)

    // O plano propõe três e indica que dois ficarão por usar
    expect(plan.proposedDates).toEqual(['2026-12-29', '2026-12-30', '2026-12-31'])
    expect(plan.proposedDates.length).toBe(3)
    expect(plan.unallocatedDays).toBe(2)
    expect(plan.balanceAfterPlan).toBe(2)

    // Aplicar o plano (guardando as datas como teletrabalho com source 'plan')
    for (const d of plan.proposedDates) {
      records[d] = { date: d, type: 'telework', source: 'plan' }
    }

    // Recalcular saldo
    balance = calculateSemesterBalance(semester, records, settings, today)
    expect(balance.usedDays).toBe(0)
    expect(balance.plannedDays).toBe(3)
    expect(balance.currentBalance).toBe(5)
    expect(balance.afterPlanBalance).toBe(2) // restam 2 dias disponíveis

    // Voltar a gerar o plano depois de o aplicar
    const secondPlan = generateTeleworkPlan(semester, records, settings, balance, today)

    // Como já não há mais datas elegíveis livres (as 3 já foram preenchidas), não deve propor datas duplicadas
    expect(secondPlan.proposedDates).toEqual([])
    expect(secondPlan.unallocatedDays).toBe(2)
    expect(secondPlan.balanceAfterPlan).toBe(2)

    // Os registos existentes mantêm-se exatamente iguais
    expect(records['2026-12-29']).toEqual({ date: '2026-12-29', type: 'telework', source: 'plan' })
    expect(records['2026-12-30']).toEqual({ date: '2026-12-30', type: 'telework', source: 'plan' })
    expect(records['2026-12-31']).toEqual({ date: '2026-12-31', type: 'telework', source: 'plan' })
  })
})
