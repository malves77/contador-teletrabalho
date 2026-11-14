import React from 'react'
import { Building2, Check, RotateCcw, Ban, Sparkles } from 'lucide-react'
import { formatDatePT, getDayOfWeek, DAY_NAMES_FULL_PT } from '../utils/dateUtils'
import type { UndoOfficeAction } from '../hooks/useContadorState'

interface QuickOfficeButtonProps {
  today: string
  todayInfo: {
    date: string
    isWeekend: boolean
    isHoliday: boolean
    holidayName?: string
    isClosure: boolean
    closureName?: string
    isNonWorking: boolean
    isOffice: boolean
    isTelework: boolean
    isVacation: boolean
  }
  lastOfficeAction: UndoOfficeAction | null
  onMarkOffice: () => void
  onUndo: () => void
}

export const QuickOfficeButton: React.FC<QuickOfficeButtonProps> = ({
  today,
  todayInfo,
  lastOfficeAction,
  onMarkOffice,
  onUndo,
}) => {
  const dow = getDayOfWeek(today)
  const weekdayName = DAY_NAMES_FULL_PT[dow]
  const formattedToday = `${weekdayName}, ${formatDatePT(today)}`

  // Disabled states
  if (todayInfo.isNonWorking) {
    let tag = 'Fim de semana'
    if (todayInfo.isHoliday) tag = todayInfo.holidayName || 'Feriado'
    if (todayInfo.isClosure) tag = todayInfo.closureName || 'Encerramento'

    return (
      <div className="bg-slate-100 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hoje em Lisboa · {tag}
            </div>
            <div className="text-sm font-medium text-slate-700">{formattedToday}</div>
          </div>
        </div>
        <button
          disabled
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-200 text-slate-400 font-semibold rounded-xl text-sm cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Building2 className="w-4 h-4" />
          Estou no escritório (Não útil)
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-200/70 rounded-2xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Date and Current Status info */}
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              todayInfo.isOffice
                ? 'bg-blue-600 text-white'
                : todayInfo.isTelework
                ? 'bg-emerald-600 text-white'
                : todayInfo.isVacation
                ? 'bg-amber-500 text-white'
                : 'bg-white text-indigo-600 border border-indigo-200'
            }`}
          >
            {todayInfo.isOffice ? (
              <Building2 className="w-6 h-6" />
            ) : todayInfo.isTelework ? (
              <Sparkles className="w-6 h-6" />
            ) : (
              <Building2 className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Hoje em Lisboa
              </span>
              {todayInfo.isOffice && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  <Check className="w-3 h-3" /> Hoje · Escritório
                </span>
              )}
              {todayInfo.isTelework && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Hoje · Teletrabalho
                </span>
              )}
              {todayInfo.isVacation && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Hoje · Férias
                </span>
              )}
              {!todayInfo.isOffice && !todayInfo.isTelework && !todayInfo.isVacation && (
                <span className="text-xs font-medium text-slate-400">Sem registo</span>
              )}
            </div>
            <div className="text-sm font-semibold text-slate-800 mt-0.5">{formattedToday}</div>
          </div>
        </div>

        {/* Buttons: Quick action + Desfazer */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {todayInfo.isOffice ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onMarkOffice}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                title="Já registado como escritório hoje"
              >
                <Check className="w-4 h-4 text-blue-600" />
                <span>Hoje · Escritório</span>
              </button>
              {lastOfficeAction && (
                <button
                  type="button"
                  onClick={onUndo}
                  className="px-3.5 py-2.5 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-300 font-medium rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  title="Desfazer registo de hoje"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Desfazer</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onMarkOffice}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all active:scale-[0.98]"
              >
                <Building2 className="w-4 h-4" />
                <span>Estou no escritório</span>
              </button>
              {lastOfficeAction && (
                <button
                  type="button"
                  onClick={onUndo}
                  className="px-3.5 py-2.5 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-300 font-medium rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  title="Desfazer registo de hoje"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Desfazer</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
