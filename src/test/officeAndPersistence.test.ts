import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useContadorState } from '../hooks/useContadorState'
import { loadRecords, loadSettings, saveRecords, saveSettings } from '../utils/storage'
import { getSemesterInfo } from '../utils/dateUtils'
import { calculateSemesterBalance } from '../utils/balance'
import type { AppSettings, DayRecordsMap } from '../types'

describe('Registo de Escritório com um toque e Desfazer', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('carregar em Estou no escritório regista hoje em Lisboa, mesmo quando o calendário mostra outro mês. O registo mantém-se depois de recarregar. Se substituir um teletrabalho já contabilizado, devolve um dia ao saldo. Desfazer restaura o teletrabalho e o saldo anterior. Verifica também a confirmação quando o dia está marcado como férias.', () => {
    // Definimos hoje como uma terça-feira útil em Lisboa: 2026-11-03
    const today = '2026-11-03'

    const initialSettings: AppSettings = {
      quota: 60,
      habitualOfficeDays: [1, 4],
      initialBalances: {
        '2026-S2': {
          usedDays: 10,
          cutOffDate: '2026-10-31',
          enabled: true,
        },
      },
      customDates: [],
    }

    // Inicialmente hoje (2026-11-03) tem registo de teletrabalho já contabilizado (10 do corte + 1 de 3 Nov = 11 usados)
    const initialRecords: DayRecordsMap = {
      '2026-11-03': { date: '2026-11-03', type: 'telework', source: 'manual' },
    }

    saveSettings(initialSettings)
    saveRecords(initialRecords)

    const { result } = renderHook(() =>
      useContadorState({
        initialToday: today,
      })
    )

    // Verificar que hoje começa com teletrabalho e saldo atual de 49 (60 - 11)
    expect(result.current.todayInfo.isTelework).toBe(true)
    expect(result.current.balance.usedDays).toBe(11)
    expect(result.current.balance.currentBalance).toBe(49)

    // O utilizador navega o calendário para outro mês (ex: Dezembro de 2026)
    act(() => {
      result.current.setMonth(2026, 12)
    })
    expect(result.current.activeMonth).toEqual({ year: 2026, month: 12 })

    // Carregar em "Estou no escritório" estando noutro mês
    act(() => {
      const res = result.current.markTodayOffice()
      expect(res.status).toBe('success')
    })

    // Deve registar imediatamente Escritório na data de hoje em Lisboa (2026-11-03)
    expect(result.current.records['2026-11-03']?.type).toBe('office')

    // Como substituiu um teletrabalho já contabilizado, devolve um dia ao saldo:
    // Os dias usados passam de 11 para 10, e o saldo atual passa de 49 para 50!
    expect(result.current.balance.usedDays).toBe(10)
    expect(result.current.balance.currentBalance).toBe(50)

    // O registo mantém-se depois de recarregar (persistência em localStorage)
    const savedRecordsAfterOffice = loadRecords()
    expect(savedRecordsAfterOffice['2026-11-03']?.type).toBe('office')

    // Carregar em "Desfazer"
    act(() => {
      result.current.undoLastOffice()
    })

    // Desfazer restaura o teletrabalho e o saldo anterior
    expect(result.current.records['2026-11-03']?.type).toBe('telework')
    expect(result.current.balance.usedDays).toBe(11)
    expect(result.current.balance.currentBalance).toBe(49)

    // Verifica também a confirmação quando o dia está marcado como férias
    act(() => {
      result.current.setDayRecord('2026-11-03', 'vacation')
    })
    expect(result.current.records['2026-11-03']?.type).toBe('vacation')

    // Ao tentar marcar escritório, deve pedir confirmação (retornar needs_confirmation)
    act(() => {
      const res = result.current.markTodayOffice()
      expect(res.status).toBe('needs_confirmation')
      expect(res.message).toContain('Férias')
    })

    // Se o utilizador confirmar (force: true), substitui o registo
    act(() => {
      const res = result.current.markTodayOffice({ force: true })
      expect(res.status).toBe('success')
    })
    expect(result.current.records['2026-11-03']?.type).toBe('office')
  })
})

describe('Separação de Semestres e Recarregamento da Página', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('a passagem de junho para julho e de dezembro para janeiro mantém os saldos separados. Recarregar a página recupera os registos, as férias, os planos aplicados, os feriados adicionais, os encerramentos e as definições.', () => {
    const s1 = getSemesterInfo(2026, 1) // 2026-01-01 a 2026-06-30
    const s2 = getSemesterInfo(2026, 2) // 2026-07-01 a 2026-12-31

    const settings: AppSettings = {
      quota: 60,
      habitualOfficeDays: [1, 4],
      initialBalances: {
        '2026-S1': { usedDays: 30, cutOffDate: '2026-03-31', enabled: true },
        '2026-S2': { usedDays: 15, cutOffDate: '2026-09-30', enabled: true },
      },
      customDates: [
        { id: 'c1', date: '2026-05-15', name: 'Ponte S1', type: 'closure' },
        { id: 'c2', date: '2026-10-16', name: 'Feriado Municipal Custom S2', type: 'holiday' },
      ],
    }

    const records: DayRecordsMap = {
      // Registos no S1
      '2026-04-10': { date: '2026-04-10', type: 'telework', source: 'manual' },
      '2026-05-18': { date: '2026-05-18', type: 'vacation', source: 'manual' },
      '2026-06-15': { date: '2026-06-15', type: 'telework', source: 'plan' },
      // Registos no S2
      '2026-10-20': { date: '2026-10-20', type: 'telework', source: 'manual' },
      '2026-11-25': { date: '2026-11-25', type: 'telework', source: 'plan' },
      '2026-12-24': { date: '2026-12-24', type: 'vacation', source: 'manual' },
    }

    // Salvar no localStorage simulando uso prévio
    saveSettings(settings)
    saveRecords(records)

    // Testar separação dos saldos calculados
    // No S1 (referência em 2026-06-30):
    // Saldo inicial = 30; 2026-04-10 e 2026-06-15 são posteriores a 31 Mar -> 30 + 2 = 32 usados
    const balanceS1 = calculateSemesterBalance(s1, records, settings, '2026-06-30')
    expect(balanceS1.usedDays).toBe(32)
    expect(balanceS1.currentBalance).toBe(28)

    // No S2 (referência em 2026-11-01):
    // Saldo inicial = 15; 2026-10-20 posterior a 30 Set e <= 1 Nov -> 15 + 1 = 16 usados; 25 Nov é planeado (1)
    const balanceS2 = calculateSemesterBalance(s2, records, settings, '2026-11-01')
    expect(balanceS2.usedDays).toBe(16)
    expect(balanceS2.plannedDays).toBe(1)
    expect(balanceS2.currentBalance).toBe(44)
    expect(balanceS2.afterPlanBalance).toBe(43)

    // Os registos de S1 não afetam o saldo de S2 e vice-versa
    expect(balanceS1.usedDays).not.toBe(balanceS2.usedDays)

    // Simular "Recarregar a página" (nova montagem / load)
    const loadedSettings = loadSettings()
    const loadedRecords = loadRecords()

    // Recupera definições e saldos iniciais
    expect(loadedSettings.quota).toBe(60)
    expect(loadedSettings.habitualOfficeDays).toEqual([1, 4])
    expect(loadedSettings.initialBalances['2026-S1']).toEqual({
      usedDays: 30,
      cutOffDate: '2026-03-31',
      enabled: true,
    })
    expect(loadedSettings.initialBalances['2026-S2']).toEqual({
      usedDays: 15,
      cutOffDate: '2026-09-30',
      enabled: true,
    })

    // Recupera feriados adicionais e encerramentos
    expect(loadedSettings.customDates.length).toBe(2)
    expect(loadedSettings.customDates.find((c) => c.id === 'c1')?.name).toBe('Ponte S1')
    expect(loadedSettings.customDates.find((c) => c.id === 'c2')?.name).toBe('Feriado Municipal Custom S2')

    // Recupera registos, férias e planos aplicados
    expect(loadedRecords['2026-05-18']?.type).toBe('vacation')
    expect(loadedRecords['2026-06-15']).toEqual({ date: '2026-06-15', type: 'telework', source: 'plan' })
    expect(loadedRecords['2026-11-25']).toEqual({ date: '2026-11-25', type: 'telework', source: 'plan' })
    expect(loadedRecords['2026-12-24']?.type).toBe('vacation')
  })
})
