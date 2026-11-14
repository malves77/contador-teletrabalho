import React, { useMemo } from 'react'
import { Sparkles, X, Check, AlertCircle, Calendar } from 'lucide-react'
import type { AppSettings, BalanceMetrics, DayRecordsMap, SemesterInfo } from '../types'
import { generateTeleworkPlan } from '../utils/distribution'
import { formatDateWithWeekdayPT } from '../utils/dateUtils'

interface PlanModalProps {
  isOpen: boolean
  semester: SemesterInfo
  records: DayRecordsMap
  settings: AppSettings
  balance: BalanceMetrics
  today: string
  onClose: () => void
  onApply: (dates: string[]) => void
}

export const PlanModal: React.FC<PlanModalProps> = ({
  isOpen,
  semester,
  records,
  settings,
  balance,
  today,
  onClose,
  onApply,
}) => {
  const planResult = useMemo(() => {
    if (!isOpen) return null
    return generateTeleworkPlan(semester, records, settings, balance, today)
  }, [isOpen, semester, records, settings, balance, today])

  if (!isOpen || !planResult) return null

  const { proposedDates, unallocatedDays, balanceAfterPlan } = planResult

  const handleApply = () => {
    onApply(proposedDates)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Distribuir Dias Restantes</h3>
              <p className="text-xs text-slate-500">{semester.label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plan Summary Metrics */}
        <div className="grid grid-cols-3 gap-2.5 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-center">
          <div>
            <span className="text-[10px] font-semibold uppercase text-slate-400 block">
              Disponíveis
            </span>
            <span className="text-lg font-bold text-slate-800">{balance.afterPlanBalance}</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase text-slate-400 block">
              Propostos
            </span>
            <span className="text-lg font-bold text-indigo-600">{proposedDates.length}</span>
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase text-slate-400 block">
              Saldo pós-plano
            </span>
            <span className="text-lg font-bold text-emerald-600">{balanceAfterPlan}</span>
          </div>
        </div>

        {/* Warning if unallocated days */}
        {unallocatedDays > 0 && (
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Atenção:</span> Devido à falta de dias elegíveis livres
              (excluindo fins de semana, feriados, encerramentos, férias e dias habituais de escritório),{' '}
              <strong>{unallocatedDays} dia{unallocatedDays > 1 ? 's' : ''} ficarão por usar</strong>.
            </div>
          </div>
        )}

        {/* Proposed Dates List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[140px]">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Pré-visualização das datas sugeridas ({proposedDates.length}):
          </div>

          {proposedDates.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Não foram encontradas datas elegíveis adicionais para este semestre.
            </div>
          ) : (
            <div className="space-y-1.5">
              {proposedDates.map((date) => (
                <div
                  key={date}
                  className="flex items-center justify-between p-2.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/80 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-800">{formatDateWithWeekdayPT(date)}</span>
                  </div>
                  <span className="font-bold text-[10px] uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Sugerido
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 shrink-0">
          <p className="text-[11px] text-slate-500">
            As sugestões só são guardadas ao carregar em Aplicar plano.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={proposedDates.length === 0}
              onClick={handleApply}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar plano</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
