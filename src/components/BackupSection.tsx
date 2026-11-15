import React, { useRef, useState } from 'react'
import { AlertTriangle, Download, FileUp, Share2, X } from 'lucide-react'
import {
  backupFileName,
  buildBackup,
  canShareBackup,
  downloadBackup,
  hasExistingData,
  shareBackup,
  validateBackupText,
  type BackupData,
  type BackupSummary,
} from '../utils/backup'

interface BackupSectionProps {
  today: string
  /** Dados guardados atualmente (não inclui alterações por guardar no modal). */
  getCurrentData: () => BackupData
  onImport: (data: BackupData, summary: BackupSummary) => void
}

interface Preview {
  fileName: string
  data: BackupData
  summary: BackupSummary
  exportedAt: string
}

export const BackupSection: React.FC<BackupSectionProps> = ({ today, getCurrentData, onImport }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const exportCurrent = async (opts: { share: boolean }) => {
    const file = buildBackup(getCurrentData())
    const name = backupFileName(today)
    setError(null)
    if (opts.share) {
      const result = await shareBackup(file, name)
      if (result === 'shared') setStatus('Ficheiro partilhado.')
      else if (result === 'failed') setError('Não foi possível partilhar. Use «Descarregar ficheiro».')
      return
    }
    downloadBackup(file, name)
    setStatus(`Ficheiro ${name} descarregado.`)
  }

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite escolher o mesmo ficheiro outra vez
    setStatus(null)
    setError(null)
    setPreview(null)
    if (!file) return
    try {
      const text = await file.text()
      const result = validateBackupText(text, file.size)
      if (!result.ok) {
        setError(`${result.message} Os dados atuais não foram alterados.`)
        return
      }
      setPreview({ fileName: file.name, data: result.data, summary: result.summary, exportedAt: result.exportedAt })
    } catch {
      setError('Não foi possível ler o ficheiro. Os dados atuais não foram alterados.')
    }
  }

  const cancelImport = () => {
    setPreview(null)
    setStatus('Importação cancelada. Os dados atuais foram mantidos.')
  }

  const confirmImport = () => {
    if (!preview) return
    onImport(preview.data, preview.summary)
    setPreview(null)
  }

  const existing = hasExistingData(getCurrentData())
  const canShare = canShareBackup(buildBackup(getCurrentData()), backupFileName(today))

  return (
    <div className="space-y-3" data-testid="backup-section">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Cópia de segurança</label>
      <p className="text-xs text-slate-600 leading-relaxed">
        A transferência é <strong>manual</strong>: os dados vivem apenas neste dispositivo. Para levar novos registos do
        telemóvel para o computador, exporte aqui e importe no outro dispositivo, sempre que quiser sincronizar.
        Funciona sem internet.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => exportCurrent({ share: false })}
          className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-1.5"
        >
          <Download className="w-4 h-4" />
          Exportar dados
        </button>
        {canShare && (
          <button
            type="button"
            onClick={() => exportCurrent({ share: true })}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            Partilhar ficheiro
          </button>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-1.5"
        >
          <FileUp className="w-4 h-4" />
          Importar dados
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Ficheiro de cópia de segurança"
          data-testid="backup-file-input"
          onChange={onFileChosen}
        />
      </div>

      {status && <p className="text-xs text-emerald-700" role="status">{status}</p>}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900" role="alert">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {preview && (
        <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3" data-testid="import-preview">
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs text-slate-800">
              <div className="font-bold">Pré-visualização · {preview.fileName}</div>
              <div className="mt-1">
                <strong>{preview.summary.semesters}</strong> semestre(s) ({preview.summary.semesterKeys.join(', ') || '—'}),{' '}
                <strong>{preview.summary.records}</strong> registo(s), {preview.summary.closedWeeks} semana(s) fechada(s),{' '}
                {preview.summary.customDates} feriado(s)/encerramento(s).
              </div>
              <div className="text-slate-500 mt-0.5">Exportado em {preview.exportedAt.slice(0, 10)}.</div>
            </div>
            <button type="button" onClick={cancelImport} aria-label="Cancelar importação" className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {existing && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
              <p>
                <strong>Já existem dados neste dispositivo.</strong> A importação <strong>substitui</strong> todos os
                registos, definições e semanas fechadas atuais pelo conteúdo do ficheiro.
              </p>
              <button
                type="button"
                onClick={() => exportCurrent({ share: false })}
                className="px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar cópia dos dados atuais
              </button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={cancelImport} className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg">
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmImport}
              className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              {existing ? 'Substituir dados atuais' : 'Importar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
