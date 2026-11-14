import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { processAutoCloseWeeks } from '../utils/autoClose'
import { getSundayWeekKey } from '../utils/dateUtils'
import { useContadorState } from '../hooks/useContadorState'
import type { AppSettings, DayRecordsMap } from '../types'

describe('Fecho automático da semana ao sábado', () => {
  it('teste de aceitação: numa semana sem feriados, regista segunda e quinta como escritório e quarta como férias. Deixa terça e sexta por preencher. Ao abrir a app no sábado, terça e sexta ficam registadas como teletrabalho. Repete o teste com a app fechada durante o fim de semana e aberta só na segunda-feira seguinte. Confirma também que uma correção manual após o fecho é preservada.', () => {
    // Semana de 8 a 14 de novembro de 2026 (sem feriados em Portugal nesta semana):
    // Domingo: 2026-11-08
    // Segunda: 2026-11-09 (Escritório)
    // Terça:   2026-11-10 (sem registo)
    // Quarta:  2026-11-11 (Férias)
    // Quinta:  2026-11-12 (Escritório)
    // Sexta:   2026-11-13 (sem registo)
    // Sábado:  2026-11-14 (Sábado de fecho)
    const weekKey = getSundayWeekKey('2026-11-08') // "week-2026-11-08"

    const baseSettings: AppSettings = {
      quota: 60,
      habitualOfficeDays: [1, 4], // Segunda e Quinta são habitual escritório
      initialBalances: {},
      customDates: [],
    }

    // Regista segunda e quinta como escritório e quarta como férias. Terça e sexta ficam por preencher.
    const initialRecords: DayRecordsMap = {
      '2026-11-09': { date: '2026-11-09', type: 'office', source: 'manual' },
      '2026-11-11': { date: '2026-11-11', type: 'vacation', source: 'manual' },
      '2026-11-12': { date: '2026-11-12', type: 'office', source: 'manual' },
    }

    // PARTE 1: Ao abrir a app no sábado (2026-11-14)
    const saturdayToday = '2026-11-14'
    const resultSaturday = processAutoCloseWeeks({
      today: saturdayToday,
      records: initialRecords,
      settings: baseSettings,
      closedWeeks: {},
      firstUsedWeekKey: weekKey,
    })

    // Terça e sexta ficam registadas como teletrabalho
    expect(resultSaturday.updatedRecords['2026-11-10']).toBeDefined()
    expect(resultSaturday.updatedRecords['2026-11-10']?.type).toBe('telework')
    expect(resultSaturday.updatedRecords['2026-11-10']?.source).toBe('auto_closed')

    expect(resultSaturday.updatedRecords['2026-11-13']).toBeDefined()
    expect(resultSaturday.updatedRecords['2026-11-13']?.type).toBe('telework')
    expect(resultSaturday.updatedRecords['2026-11-13']?.source).toBe('auto_closed')

    // Segunda, quarta e quinta mantêm-se exatamente como estavam (preservadas)
    expect(resultSaturday.updatedRecords['2026-11-09']?.type).toBe('office')
    expect(resultSaturday.updatedRecords['2026-11-09']?.source).toBe('manual')

    expect(resultSaturday.updatedRecords['2026-11-11']?.type).toBe('vacation')
    expect(resultSaturday.updatedRecords['2026-11-11']?.source).toBe('manual')

    expect(resultSaturday.updatedRecords['2026-11-12']?.type).toBe('office')
    expect(resultSaturday.updatedRecords['2026-11-12']?.source).toBe('manual')

    // A semana foi marcada como fechada e tem 2 dias registados
    expect(resultSaturday.updatedClosedWeeks[weekKey]).toBeDefined()
    expect(resultSaturday.totalAutoClosedDays).toBe(2)
    expect(resultSaturday.summaryMessage).toBe('Semana concluída · 2 dias registados como teletrabalho')

    // PARTE 2: Repete o teste com a app fechada durante o fim de semana e aberta só na segunda-feira seguinte (2026-11-16)
    // Se a app não tivesse sido aberta no sábado, a semana estaria pendente
    const mondayNextWeek = '2026-11-16'
    const resultMondayPending = processAutoCloseWeeks({
      today: mondayNextWeek,
      records: initialRecords,
      settings: baseSettings,
      closedWeeks: {}, // Simula não ter sido aberta no sábado
      firstUsedWeekKey: weekKey,
    })

    // Terça e sexta foram igualmente fechadas como teletrabalho
    expect(resultMondayPending.updatedRecords['2026-11-10']?.type).toBe('telework')
    expect(resultMondayPending.updatedRecords['2026-11-13']?.type).toBe('telework')
    expect(resultMondayPending.updatedClosedWeeks[weekKey]).toBeDefined()
    expect(resultMondayPending.totalAutoClosedDays).toBe(2)
    expect(resultMondayPending.summaryMessage).toBe('Semana concluída · 2 dias registados como teletrabalho')

    // PARTE 3: Confirma também que uma correção manual após o fecho é preservada
    // Utilizador corrige terça-feira (2026-11-10) para Escritório ou apaga-a após o fecho
    const recordsAfterCorrection: DayRecordsMap = {
      ...resultSaturday.updatedRecords,
      '2026-11-10': { date: '2026-11-10', type: 'office', source: 'manual' }, // corrigido manualmente
    }

    // Reabrir a app na segunda-feira seguinte com o histórico de semanas fechadas
    const resultReopen = processAutoCloseWeeks({
      today: mondayNextWeek,
      records: recordsAfterCorrection,
      settings: baseSettings,
      closedWeeks: resultSaturday.updatedClosedWeeks,
      firstUsedWeekKey: weekKey,
    })

    // A alteração manual em 2026-11-10 é preservada e NÃO é substituída de volta por teletrabalho
    expect(resultReopen.updatedRecords['2026-11-10']?.type).toBe('office')
    expect(resultReopen.updatedRecords['2026-11-10']?.source).toBe('manual')
    expect(resultReopen.updatedRecords['2026-11-13']?.type).toBe('telework')
    // Não há novos fechos redundantes para essa semana
    expect(resultReopen.newlyClosedWeeks.length).toBe(0)
  })

  it('ignora datas cobertas por data de corte de saldo inicial', () => {
    // Suponhamos que o corte é 2026-11-11.
    // Dias <= 2026-11-11 não devem ser alterados pelo fecho automático
    const weekKey = getSundayWeekKey('2026-11-08')
    const settings: AppSettings = {
      quota: 60,
      habitualOfficeDays: [1, 4],
      initialBalances: {
        '2026-S2': {
          usedDays: 20,
          cutOffDate: '2026-11-11', // Corte na quarta-feira
          enabled: true,
        },
      },
      customDates: [],
    }

    const records: DayRecordsMap = {}
    const result = processAutoCloseWeeks({
      today: '2026-11-14',
      records,
      settings,
      closedWeeks: {},
      firstUsedWeekKey: weekKey,
    })

    // Segunda (9), Terça (10) e Quarta (11) estão cobertos pelo corte -> ignorados
    expect(result.updatedRecords['2026-11-09']).toBeUndefined()
    expect(result.updatedRecords['2026-11-10']).toBeUndefined()
    expect(result.updatedRecords['2026-11-11']).toBeUndefined()

    // Quinta (12) e Sexta (13) são posteriores ao corte -> fechados como teletrabalho
    expect(result.updatedRecords['2026-11-12']?.type).toBe('telework')
    expect(result.updatedRecords['2026-11-13']?.type).toBe('telework')
    expect(result.totalAutoClosedDays).toBe(2)
  })

  it('converte sugestões do plano prévias (source: plan) em registos fechados', () => {
    const weekKey = getSundayWeekKey('2026-11-08')
    const settings: AppSettings = {
      quota: 60,
      habitualOfficeDays: [1, 4],
      initialBalances: {},
      customDates: [],
    }

    const records: DayRecordsMap = {
      '2026-11-10': { date: '2026-11-10', type: 'telework', source: 'plan' },
    }

    const result = processAutoCloseWeeks({
      today: '2026-11-14',
      records,
      settings,
      closedWeeks: {},
      firstUsedWeekKey: weekKey,
    })

    // A sugestão do plano passa a auto_closed (registado definitivamente)
    expect(result.updatedRecords['2026-11-10']?.source).toBe('auto_closed')
  })

  it('integração através do hook useContadorState: executa no sábado, apresenta notificação e preserva correções', () => {
    localStorage.clear()

    const initialRecords: DayRecordsMap = {
      '2026-11-09': { date: '2026-11-09', type: 'office', source: 'manual' },
      '2026-11-11': { date: '2026-11-11', type: 'vacation', source: 'manual' },
      '2026-11-12': { date: '2026-11-12', type: 'office', source: 'manual' },
    }

    const { result } = renderHook(() =>
      useContadorState({
        initialToday: '2026-11-14', // Sábado
        initialRecords,
        initialFirstUsedWeekKey: 'week-2026-11-08',
      })
    )

    // Notificação foi acionada
    expect(result.current.autoCloseNotification).toBe(
      'Semana concluída · 2 dias registados como teletrabalho'
    )

    // Terça (10) e Sexta (13) foram registados como teletrabalho
    expect(result.current.records['2026-11-10']?.type).toBe('telework')
    expect(result.current.records['2026-11-13']?.type).toBe('telework')

    // Preservou segunda, quarta e quinta
    expect(result.current.records['2026-11-09']?.type).toBe('office')
    expect(result.current.records['2026-11-11']?.type).toBe('vacation')
    expect(result.current.records['2026-11-12']?.type).toBe('office')

    // O utilizador corrige terça-feira para escritório
    act(() => {
      result.current.setDayRecord('2026-11-10', 'office')
    })
    expect(result.current.records['2026-11-10']?.type).toBe('office')

    // Executar auto-close novamente não deve reverter a alteração manual
    act(() => {
      result.current.runAutoClose()
    })
    expect(result.current.records['2026-11-10']?.type).toBe('office')
    expect(result.current.records['2026-11-10']?.source).toBe('manual')
  })
})
