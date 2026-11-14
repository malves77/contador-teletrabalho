import React from 'react'
import { Building2, Laptop, Palmtree, Trash2, X, AlertCircle } from 'lucide-react'
import type { AppSettings, DayRecord, DayRecordType } from '../types'
import { formatDateWithWeekdayPT, getDayOfWeek, isWeekend } from '../utils/dateUtils'
import { getHolidayOrClosureInfo } from '../utils/holidays'

interface DayModalProps {
  date: string | null
  currentRecord?: DayRecord
  settings: AppSettings
  onClose: () => void
  onSave: (date: string, type: DayRecordType | null) => void
}

export const DayModal: React.FC<DayModalProps> = ({
  date,
  currentRecord,
  settings,
  onClose,
  onSave,
}) => {
  if (!date) return null

  const weekend = isWeekend(date)
  const holidayInfo = getHolidayOrClosureInfo(date, settings.customDates)
  const dow = getDayOfWeek(date)
  const isHabitualOffice = settings.habitualOfficeDays.includes(dow)
  const isNonWorking = weekend || holidayInfo.isHoliday || holidayInfo.isClosure

  const handleSelect = (type: DayRecordType | null) => {
    onSave(date, type)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Editar Dia
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {formatDateWithWeekdayPT(date)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info alerts */}
        {holidayInfo.isHoliday && (
          <div className="flex items-center gap-2 p-3 bg-purple-50 text-purple-900 text-xs rounded-xl border border-purple-100">
            <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Feriado oficial: <strong>{holidayInfo.holidayName}</strong></span>
          </div>
        )}

        {holidayInfo.isClosure && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 text-rose-900 text-xs rounded-xl border border-rose-100">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Encerramento: <strong>{holidayInfo.closureName}</strong></span>
          </div>
        )}

        {weekend && (
          <div className="flex items-center gap-2 p-3 bg-slate-100 text-slate-700 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Fim de semana (dia não útil)</span>
          </div>
        )}

        {!weekend && isHabitualOffice && !isNonWorking && (
          <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            ℹ️ Este dia é habitualmente de escritório pelas suas definições semanais.
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Escritório */}
          <button
            type="button"
            onClick={() => handleSelect('office')}
            className={`w-full p-3 rounded-xl border flex items-center justify-between text-sm font-semibold transition-all ${
              currentRecord?.type === 'office'
                ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-500/20'
                : 'bg-white hover:bg-blue-50/50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                <Building2 className="w-4 h-4" />
              </div>
              <span>Escritório</span>
            </div>
            {currentRecord?.type === 'office' && (
              <span className="text-xs font-bold text-blue-600">Ativo</span>
            )}
          </button>

          {/* Teletrabalho */}
          <button
            type="button"
            onClick={() => handleSelect('telework')}
            className={`w-full p-3 rounded-xl border flex items-center justify-between text-sm font-semibold transition-all ${
              currentRecord?.type === 'telework'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20'
                : 'bg-white hover:bg-emerald-50/50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Laptop className="w-4 h-4" />
              </div>
              <span>Teletrabalho</span>
            </div>
            {currentRecord?.type === 'telework' && (
              <span className="text-xs font-bold text-emerald-600">Ativo</span>
            )}
          </button>

          {/* Férias */}
          <button
            type="button"
            onClick={() => handleSelect('vacation')}
            className={`w-full p-3 rounded-xl border flex items-center justify-between text-sm font-semibold transition-all ${
              currentRecord?.type === 'vacation'
                ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-500/20'
                : 'bg-white hover:bg-amber-50/50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Palmtree className="w-4 h-4" />
              </div>
              <span>Férias</span>
            </div>
            {currentRecord?.type === 'vacation' && (
              <span className="text-xs font-bold text-amber-600">Ativo</span>
            )}
          </button>

          {/* Limpar registo */}
          {currentRecord && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full mt-2 p-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpar registo deste dia</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
