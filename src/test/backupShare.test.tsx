import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'
import { STORAGE_KEYS, saveRecords, saveSettings } from '../utils/storage'
import { validateBackupText, type BackupFile } from '../utils/backup'
import type { AppSettings, DayRecordsMap } from '../types'

const sampleSettings: AppSettings = {
  quota: 60,
  habitualOfficeDays: [1, 4],
  initialBalances: {
    '2026-S2': { usedDays: 15, cutOffDate: '2026-10-31', enabled: true },
  },
  customDates: [{ id: 'c1', date: '2026-12-24', name: 'Encerramento', type: 'closure' }],
}

const sampleRecords: DayRecordsMap = {
  '2026-11-03': { date: '2026-11-03', type: 'telework', source: 'manual' },
  '2026-11-05': { date: '2026-11-05', type: 'office', source: 'manual' },
}

describe('Partilha e exportação de cópia de segurança', () => {
  const originalUserAgent = navigator.userAgent
  const originalShare = navigator.share
  const originalCanShare = navigator.canShare

  beforeEach(() => {
    localStorage.clear()
    saveSettings(sampleSettings)
    saveRecords(sampleRecords)
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, configurable: true })
    Object.defineProperty(navigator, 'share', { value: originalShare, configurable: true })
    Object.defineProperty(navigator, 'canShare', { value: originalCanShare, configurable: true })
    vi.restoreAllMocks()
  })

  function mockShareApi(options: {
    canShareResult?: boolean
    shareImpl?: (data?: ShareData) => Promise<void>
    userAgent?: string
  }) {
    if (options.userAgent !== undefined) {
      Object.defineProperty(navigator, 'userAgent', { value: options.userAgent, configurable: true })
    }
    const canShareMock = vi.fn().mockReturnValue(options.canShareResult ?? true)
    const shareMock = vi.fn(options.shareImpl ?? (async () => {}))
    Object.defineProperty(navigator, 'canShare', { value: canShareMock, configurable: true })
    Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true })
    return { canShareMock, shareMock }
  }

  it('verifica suporte com navigator.canShare usando o ficheiro efetivo e conclui partilha síncrona ao toque', async () => {
    const { canShareMock, shareMock } = mockShareApi({ canShareResult: true })

    render(<App />)
    fireEvent.click(screen.getByText('Definições'))

    const shareBtn = await screen.findByRole('button', { name: /Partilhar ficheiro/i })
    expect(canShareMock).toHaveBeenCalled()
    const checkedPayload = canShareMock.mock.calls[0][0] as ShareData
    expect(checkedPayload.files).toHaveLength(1)
    expect(checkedPayload.files![0].name).toMatch(/^contador-teletrabalho-\d{4}-\d{2}-\d{2}\.json$/)
    expect(checkedPayload.files![0].type).toBe('application/json')

    fireEvent.click(shareBtn)
    // A chamada a navigator.share ocorre sincronamente na ativação do clique
    expect(shareMock).toHaveBeenCalledTimes(1)
    const sharedData = shareMock.mock.calls[0][0] as ShareData
    expect(sharedData.files).toHaveLength(1)
    const sharedText = await sharedData.files![0].text()
    const parsed = JSON.parse(sharedText) as BackupFile
    expect(parsed.records['2026-11-03']?.type).toBe('telework')
    expect(parsed.settings.quota).toBe(60)

    expect(await screen.findByText('Ficheiro partilhado.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('no Android usa ficheiro text/plain compatível com Web Share API mantendo conteúdo JSON válido', async () => {
    const { canShareMock, shareMock } = mockShareApi({
      canShareResult: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/129.0.0.0 Mobile Safari/537.36',
    })

    render(<App />)
    fireEvent.click(screen.getByText('Definições'))

    const shareBtn = await screen.findByRole('button', { name: /Partilhar ficheiro/i })
    const checkedFile = (canShareMock.mock.calls[0][0] as ShareData).files![0]
    expect(checkedFile.name).toMatch(/^contador-teletrabalho-\d{4}-\d{2}-\d{2}\.txt$/)
    expect(checkedFile.type).toBe('text/plain')

    fireEvent.click(shareBtn)
    expect(shareMock).toHaveBeenCalledTimes(1)
    const sharedFile = (shareMock.mock.calls[0][0] as ShareData).files![0]
    const validation = validateBackupText(await sharedFile.text())
    expect(validation.ok).toBe(true)

    expect(await screen.findByText('Ficheiro partilhado.')).toBeInTheDocument()
  })

  it('trata o cancelamento da janela de partilha (AbortError) como ação normal sem erro', async () => {
    mockShareApi({
      canShareResult: true,
      shareImpl: async () => {
        throw new DOMException('Share canceled', 'AbortError')
      },
    })

    render(<App />)
    fireEvent.click(screen.getByText('Definições'))

    const shareBtn = await screen.findByRole('button', { name: /Partilhar ficheiro/i })
    fireEvent.click(shareBtn)

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  it('oculta Partilhar ficheiro quando não há suporte em navigator.canShare e mantém Exportar dados', async () => {
    mockShareApi({ canShareResult: false })

    render(<App />)
    fireEvent.click(screen.getByText('Definições'))

    await screen.findByTestId('backup-section')
    expect(screen.queryByRole('button', { name: /Partilhar ficheiro/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Exportar dados/i })).toBeInTheDocument()
  })

  it('mostra mensagem correta com «Exportar dados» quando navigator.share falha', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockShareApi({
      canShareResult: true,
      shareImpl: async () => {
        throw new DOMException('Permission denied', 'NotAllowedError')
      },
    })

    render(<App />)
    fireEvent.click(screen.getByText('Definições'))

    const shareBtn = await screen.findByRole('button', { name: /Partilhar ficheiro/i })
    fireEvent.click(shareBtn)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível partilhar. Use “Exportar dados” para guardar o ficheiro.')
    expect(screen.getByRole('button', { name: /Exportar dados/i })).toBeInTheDocument()
  })

  it('exporta JSON válido via Exportar dados e reimporta preservando registos e definições', async () => {
    let capturedBlob: Blob | null = null
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob
      return 'blob:mock-backup'
    })
    URL.revokeObjectURL = vi.fn()
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    try {
      render(<App />)
      fireEvent.click(screen.getByText('Definições'))

      const exportBtn = await screen.findByRole('button', { name: /Exportar dados/i })
      fireEvent.click(exportBtn)

      expect(anchorClickSpy).toHaveBeenCalledTimes(1)
      expect(capturedBlob).not.toBeNull()
      expect(capturedBlob!.type).toBe('application/json')
      const exportedText = await capturedBlob!.text()

      // Simula outro dispositivo/perfil limpo e importa o JSON descarregado
      localStorage.clear()
      const { unmount } = render(<App />)
      unmount()

      render(<App />)
      const settingsButtons = screen.getAllByText('Definições')
      fireEvent.click(settingsButtons[settingsButtons.length - 1])

      const fileInputs = await screen.findAllByTestId('backup-file-input')
      const fileInput = fileInputs[fileInputs.length - 1]
      const file = new File([exportedText], 'contador-teletrabalho-2026-11-17.json', {
        type: 'application/json',
      })
      fireEvent.change(fileInput, { target: { files: [file] } })

      await screen.findByTestId('import-preview')
      fireEvent.click(screen.getByRole('button', { name: /^(Importar|Substituir dados atuais)$/ }))

      await waitFor(() => {
        expect(localStorage.getItem(STORAGE_KEYS.RECORDS)).toContain('2026-11-03')
      })
      const restoredSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)!) as AppSettings
      expect(restoredSettings.quota).toBe(60)
      expect(restoredSettings.customDates).toHaveLength(1)
      expect(restoredSettings.initialBalances['2026-S2']?.usedDays).toBe(15)
    } finally {
      URL.createObjectURL = originalCreateObjectURL
      URL.revokeObjectURL = originalRevokeObjectURL
    }
  })
})
