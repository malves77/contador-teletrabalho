import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { calculateSemesterBalance } from '../utils/balance'
import { getSemesterInfo } from '../utils/dateUtils'
import { processAutoCloseWeeks } from '../utils/autoClose'
import { buildBackup } from '../utils/backup'
import { STORAGE_KEYS } from '../utils/storage'
import App from '../App'
import type { AppSettings, DayRecordsMap } from '../types'

function createSettings(quota: number, initialUsedDays?: number, cutOffDate = '2026-10-31'): AppSettings {
  return {
    quota,
    habitualOfficeDays: [1, 4],
    initialBalances:
      typeof initialUsedDays === 'number'
        ? {
            '2026-S2': {
              usedDays: initialUsedDays,
              cutOffDate,
              enabled: true,
            },
          }
        : {},
    customDates: [],
  }
}

describe('Tolerância de 15% e avisos de saldo', () => {
  const semester = getSemesterInfo('2026-10-31') // 2026-S2
  const today = '2026-10-31'

  it('calcula corretamente os estados para 59, 60, 61, 68, 69 e 70 dias usados com quota 60', () => {
    const cases = [
      {
        used: 59,
        currentBalance: 1,
        state: 'within_quota',
        expectedMessage: 'Dentro da quota · 1 dia disponível',
      },
      {
        used: 60,
        currentBalance: 0,
        state: 'within_quota',
        expectedMessage: 'Quota esgotada · 9 dias de tolerância disponíveis',
      },
      {
        used: 61,
        currentBalance: -1,
        state: 'within_tolerance',
        expectedMessage: 'Dentro da tolerância · 1 de 9 dias adicionais usados',
      },
      {
        used: 68,
        currentBalance: -8,
        state: 'within_tolerance',
        expectedMessage: 'Dentro da tolerância · 8 de 9 dias adicionais usados',
      },
      {
        used: 69,
        currentBalance: -9,
        state: 'within_tolerance',
        expectedMessage: 'Tolerância esgotada · limite de 69 dias atingido',
      },
      {
        used: 70,
        currentBalance: -10,
        state: 'over_tolerance',
        expectedMessage: 'Tolerância ultrapassada · 1 dia acima do limite de 69',
      },
    ]

    for (const c of cases) {
      const balance = calculateSemesterBalance(semester, {}, createSettings(60, c.used), today)
      expect(balance.usedDays).toBe(c.used)
      expect(balance.currentBalance).toBe(c.currentBalance)
      expect(balance.afterPlanBalance).toBe(c.currentBalance)
      expect(balance.tolerance.toleranceDays).toBe(9)
      expect(balance.tolerance.maxDaysWithTolerance).toBe(69)
      expect(balance.tolerance.state).toBe(c.state)
      expect(balance.tolerance.message).toBe(c.expectedMessage)
    }
  })

  it('calcula a tolerância de 15% arredondada por defeito para quotas configuráveis', () => {
    // Quota 50 -> 15% = 7.5 -> arredondado por defeito = 7 dias (máximo 57)
    const b50 = calculateSemesterBalance(semester, {}, createSettings(50, 53), today)
    expect(b50.tolerance.toleranceDays).toBe(7)
    expect(b50.tolerance.maxDaysWithTolerance).toBe(57)
    expect(b50.currentBalance).toBe(-3)
    expect(b50.tolerance.state).toBe('within_tolerance')
    expect(b50.tolerance.message).toBe('Dentro da tolerância · 3 de 7 dias adicionais usados')

    const b50Max = calculateSemesterBalance(semester, {}, createSettings(50, 57), today)
    expect(b50Max.tolerance.message).toBe('Tolerância esgotada · limite de 57 dias atingido')

    const b50Over = calculateSemesterBalance(semester, {}, createSettings(50, 59), today)
    expect(b50Over.tolerance.state).toBe('over_tolerance')
    expect(b50Over.tolerance.message).toBe('Tolerância ultrapassada · 2 dias acima do limite de 57')
  })

  it('mostra aviso de previsão quando o plano futuro entra na tolerância ou ultrapassa o limite', () => {
    const recordsEnteringTolerance: DayRecordsMap = {
      '2026-11-03': { date: '2026-11-03', type: 'telework', source: 'plan' },
      '2026-11-04': { date: '2026-11-04', type: 'telework', source: 'plan' },
      '2026-11-05': { date: '2026-11-05', type: 'telework', source: 'plan' },
    }

    // 59 usados + 3 planeados = 62 (entra na tolerância: 2 de 9)
    const entering = calculateSemesterBalance(
      semester,
      recordsEnteringTolerance,
      createSettings(60, 59),
      today
    )
    expect(entering.tolerance.state).toBe('within_quota')
    expect(entering.tolerance.message).toBe('Dentro da quota · 1 dia disponível')
    expect(entering.tolerance.forecastState).toBe('within_tolerance')
    expect(entering.tolerance.forecastMessage).toContain('Previsão após plano')
    expect(entering.tolerance.forecastMessage).toContain('2 de 9 dias adicionais previstos')
    expect(entering.currentBalance).toBe(1)
    expect(entering.afterPlanBalance).toBe(-2)

    // 68 usados + 3 planeados = 71 (ultrapassa o limite de 69 em 2 dias)
    const exceeding = calculateSemesterBalance(
      semester,
      recordsEnteringTolerance,
      createSettings(60, 68),
      today
    )
    expect(exceeding.tolerance.state).toBe('within_tolerance')
    expect(exceeding.tolerance.forecastState).toBe('over_tolerance')
    expect(exceeding.tolerance.forecastMessage).toContain('Previsão após plano')
    expect(exceeding.tolerance.forecastMessage).toContain('ultrapassa o limite de tolerância de 69 dias em 2 dias')
  })

  it('atualiza o aviso de tolerância com saldo inicial, fecho semanal automático e importação de cópia de segurança', async () => {
    // 1. Fecho semanal automático regista dias de teletrabalho e reflete-se no aviso de tolerância
    const weekRecords: DayRecordsMap = {
      '2026-11-02': { date: '2026-11-02', type: 'office', source: 'manual' },
      '2026-11-05': { date: '2026-11-05', type: 'office', source: 'manual' },
    }
    const settings = createSettings(60, 59, '2026-10-31')
    const closeResult = processAutoCloseWeeks({
      records: weekRecords,
      settings,
      closedWeeks: {},
      firstUsedWeek: 'week-2026-11-01',
      today: '2026-11-07', // sábado: fecha ter(3), qua(4), sex(6) -> +3 dias => 59 + 3 = 62
    })

    const afterCloseBalance = calculateSemesterBalance(
      semester,
      closeResult.updatedRecords,
      settings,
      '2026-11-07'
    )
    expect(afterCloseBalance.usedDays).toBe(62)
    expect(afterCloseBalance.currentBalance).toBe(-2)
    expect(afterCloseBalance.tolerance.state).toBe('within_tolerance')
    expect(afterCloseBalance.tolerance.message).toBe('Dentro da tolerância · 2 de 9 dias adicionais usados')

    // 2. Importação de cópia de segurança na UI atualiza imediatamente os avisos de tolerância
    localStorage.clear()
    render(<App />)
    expect(screen.getByTestId('tolerance-notice')).toHaveTextContent('Dentro da quota')

    // Prepara um backup para o semestre atual com saldo inicial de 63 dias
    const nowYear = new Date().getFullYear()
    const nowMonth = new Date().getMonth() + 1
    const currentSemKey = `${nowYear}-S${nowMonth <= 6 ? 1 : 2}`
    const currentCutOff = `${nowYear}-${String(nowMonth).padStart(2, '0')}-01`
    const importedSettings: AppSettings = {
      quota: 60,
      habitualOfficeDays: [1, 4],
      initialBalances: {
        [currentSemKey]: {
          usedDays: 63,
          cutOffDate: currentCutOff,
          enabled: true,
        },
      },
      customDates: [],
    }
    const backup = buildBackup({
      settings: importedSettings,
      records: {},
      closedWeeks: {},
      firstUsedWeekKey: null,
    })

    fireEvent.click(screen.getByText('Definições'))
    const fileInput = await screen.findByTestId('backup-file-input')
    const file = new File([JSON.stringify(backup)], 'backup.json', { type: 'application/json' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await screen.findByTestId('import-preview')
    const importBtn = screen.getByRole('button', { name: /^(Importar|Substituir dados atuais)$/ })
    fireEvent.click(importBtn)
    expect(await screen.findByTestId('tolerance-notice')).toHaveTextContent(
      'Dentro da tolerância · 3 de 9 dias adicionais usados'
    )
    expect(localStorage.getItem(STORAGE_KEYS.SETTINGS)).toContain('"usedDays":63')
  })
})
