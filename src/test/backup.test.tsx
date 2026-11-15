import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'
import { useContadorState } from '../hooks/useContadorState'
import { STORAGE_KEYS, saveRecords, saveSettings } from '../utils/storage'
import {
  BACKUP_VERSION,
  backupFileName,
  buildBackup,
  validateBackupText,
  type BackupData,
} from '../utils/backup'
import { getSundayWeekKey, getTodayLisbon } from '../utils/dateUtils'
import type { AppSettings, DayRecordsMap } from '../types'

const settings: AppSettings = {
  quota: 55,
  habitualOfficeDays: [2, 4],
  initialBalances: { '2026-S2': { usedDays: 20, cutOffDate: '2026-10-31', enabled: true } },
  customDates: [
    { id: 'h1', date: '2026-12-24', name: 'Ponte', type: 'closure' },
    { id: 'h2', date: '2026-11-20', name: 'Feriado local', type: 'holiday' },
  ],
}

function sampleData(): BackupData {
  return {
    settings,
    records: {
      '2026-03-10': { date: '2026-03-10', type: 'telework', source: 'manual' },
      '2026-11-09': { date: '2026-11-09', type: 'office', source: 'manual' },
      '2026-12-02': { date: '2026-12-02', type: 'telework', source: 'plan' },
      '2026-12-28': { date: '2026-12-28', type: 'vacation', source: 'manual' },
    },
    closedWeeks: {
      'week-2026-11-01': {
        weekKey: 'week-2026-11-01',
        saturdayDate: '2026-11-07',
        closedAt: '2026-11-07T10:00:00.000Z',
        autoClosedDates: ['2026-11-04'],
        count: 1,
      },
    },
    firstUsedWeekKey: getSundayWeekKey(getTodayLisbon()),
  }
}

const backupText = (data: BackupData = sampleData()) => JSON.stringify(buildBackup(data))

describe('Cópia de segurança · formato e validação', () => {
  it('nome do ficheiro e conteúdo versionado com todos os dados', () => {
    expect(backupFileName('2026-11-15')).toBe('contador-teletrabalho-2026-11-15.json')
    const file = buildBackup(sampleData())
    expect(file.version).toBe(BACKUP_VERSION)
    expect(Object.keys(file)).toEqual(
      expect.arrayContaining(['format', 'version', 'exportedAt', 'settings', 'records', 'closedWeeks', 'firstUsedWeekKey'])
    )
  })

  it('aceita um ficheiro válido e resume semestres e registos', () => {
    const result = validateBackupText(backupText())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.summary.records).toBe(4)
    // 2026-S1 (março), 2026-S2 (nov/dez + saldo inicial)
    expect(result.summary.semesters).toBe(2)
    expect(result.data.settings).toEqual(settings)
    expect(result.data.closedWeeks['week-2026-11-01'].autoClosedDates).toEqual(['2026-11-04'])
  })

  it('rejeita ficheiros inválidos sem exceções', () => {
    const base = JSON.parse(backupText())
    const bad = (mutate: (b: Record<string, any>) => void) => {
      const copy = JSON.parse(JSON.stringify(base))
      mutate(copy)
      return validateBackupText(JSON.stringify(copy))
    }
    expect(validateBackupText('isto não é json').ok).toBe(false)
    expect(validateBackupText('[]').ok).toBe(false)
    expect(validateBackupText('{"format":"outro"}').ok).toBe(false)
    expect(bad((b) => delete b.records).ok).toBe(false)
    expect(bad((b) => (b.records['2026-03-10'].type = 'folga')).ok).toBe(false)
    expect(bad((b) => (b.records['2026-13-45'] = { date: '2026-13-45', type: 'office' })).ok).toBe(false)
    expect(bad((b) => (b.settings.quota = -3)).ok).toBe(false)
    expect(bad((b) => (b.settings.habitualOfficeDays = [9])).ok).toBe(false)
    expect(bad((b) => (b.settings.initialBalances['2026-S2'].cutOffDate = '31/10/2026')).ok).toBe(false)
    expect(bad((b) => (b.closedWeeks['week-2026-11-01'].count = 'x')).ok).toBe(false)
  })

  it('rejeita uma versão incompatível e um ficheiro demasiado grande', () => {
    const future = JSON.parse(backupText())
    future.version = BACKUP_VERSION + 1
    const r = validateBackupText(JSON.stringify(future))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('incompatible')
    const big = validateBackupText('{}', 6 * 1024 * 1024)
    expect(big.ok).toBe(false)
  })
})

describe('Cópia de segurança · transferência entre perfis', () => {
  beforeEach(() => localStorage.clear())

  it('exporta de um perfil, importa noutro e preserva correções de semanas já fechadas', () => {
    // Perfil A: semana 8–14 nov com terça e sexta por preencher; abre no sábado 14
    saveSettings({ ...settings, initialBalances: {} })
    saveRecords({
      '2026-11-09': { date: '2026-11-09', type: 'office', source: 'manual' },
      '2026-11-11': { date: '2026-11-11', type: 'vacation', source: 'manual' },
      '2026-11-12': { date: '2026-11-12', type: 'office', source: 'manual' },
    })
    const a = renderHook(() =>
      useContadorState({ initialToday: '2026-11-14', initialFirstUsedWeekKey: 'week-2026-11-08' })
    )
    expect(a.result.current.records['2026-11-10']?.type).toBe('telework')
    expect(a.result.current.records['2026-11-13']?.type).toBe('telework')
    // Correção depois do fecho: apaga sexta
    act(() => a.result.current.setDayRecord('2026-11-13', null))
    expect(a.result.current.records['2026-11-13']).toBeUndefined()

    const exported = backupText({
      settings: a.result.current.settings,
      records: a.result.current.records,
      closedWeeks: a.result.current.closedWeeks,
      firstUsedWeekKey: a.result.current.firstUsedWeekKey,
    })
    const recordsA = a.result.current.records
    const settingsA = a.result.current.settings
    const balanceA = a.result.current.balance
    a.unmount()

    // Perfil B: armazenamento vazio; abre só na segunda 16
    localStorage.clear()
    const b = renderHook(() => useContadorState({ initialToday: '2026-11-16' }))
    const parsed = validateBackupText(exported)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    act(() => b.result.current.replaceAllData(parsed.data))

    expect(b.result.current.records).toEqual(recordsA)
    expect(b.result.current.settings).toEqual(settingsA)
    expect(b.result.current.balance.usedDays).toBe(balanceA.usedDays)
    // O dia apagado depois do fecho mantém-se apagado
    expect(b.result.current.records['2026-11-13']).toBeUndefined()
    expect(b.result.current.autoCloseNotification).toBeNull()
    b.unmount()

    // Reabrir: o fecho automático não repõe o dia apagado
    const reopened = renderHook(() => useContadorState({ initialToday: '2026-11-16' }))
    expect(reopened.result.current.records['2026-11-13']).toBeUndefined()
    expect(reopened.result.current.records['2026-11-10']?.type).toBe('telework')
    expect(reopened.result.current.closedWeeks['week-2026-11-08']).toBeDefined()
  })
})

describe('Cópia de segurança · interface de importação', () => {
  beforeEach(() => {
    localStorage.clear()
    saveSettings(settings)
    saveRecords({ '2026-10-05': { date: '2026-10-05', type: 'telework', source: 'manual' } } as DayRecordsMap)
  })

  const stored = () => localStorage.getItem(STORAGE_KEYS.RECORDS)

  async function chooseFile(content: string, name = 'backup.json') {
    fireEvent.click(screen.getByText('Definições'))
    const input = (await screen.findByTestId('backup-file-input')) as HTMLInputElement
    const file = new File([content], name, { type: 'application/json' })
    fireEvent.change(input, { target: { files: [file] } })
  }

  it('ficheiro inválido: mostra erro e preserva os dados', async () => {
    const before = stored()
    render(<App />)
    await chooseFile('{ não é json')
    expect(await screen.findByRole('alert')).toHaveTextContent(/dados atuais não foram alterados/i)
    expect(screen.queryByTestId('import-preview')).not.toBeInTheDocument()
    expect(stored()).toBe(before)
  })

  it('versão incompatível: mostra erro e preserva os dados', async () => {
    const before = stored()
    const future = { ...JSON.parse(backupText()), version: BACKUP_VERSION + 4 }
    render(<App />)
    await chooseFile(JSON.stringify(future))
    expect(await screen.findByRole('alert')).toHaveTextContent(/incompatível/i)
    expect(stored()).toBe(before)
  })

  it('pré-visualização, aviso de substituição e cancelamento preservam os dados', async () => {
    const before = stored()
    render(<App />)
    await chooseFile(backupText())
    const preview = await screen.findByTestId('import-preview')
    expect(preview).toHaveTextContent('2 semestre(s)')
    expect(preview).toHaveTextContent('4 registo(s)')
    expect(preview).toHaveTextContent(/substitui/i)
    expect(screen.getByText('Exportar cópia dos dados atuais')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Cancelar importação'))
    expect(screen.queryByTestId('import-preview')).not.toBeInTheDocument()
    expect(stored()).toBe(before)
  })

  it('confirmar substitui os dados e atualiza o calendário e saldos de imediato', async () => {
    render(<App />)
    await chooseFile(backupText())
    await screen.findByTestId('import-preview')
    fireEvent.click(screen.getByText('Substituir dados atuais'))
    await waitFor(() => expect(screen.getByText(/Dados importados · 2 semestre\(s\) e 4 registo\(s\)/)).toBeInTheDocument())
    const saved = JSON.parse(stored() as string)
    expect(Object.keys(saved).sort()).toEqual(['2026-03-10', '2026-11-09', '2026-12-02', '2026-12-28'])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) as string).quota).toBe(55)
  })
})
