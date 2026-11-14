import React, { useState, useMemo } from 'react'
import { Palmtree, X } from 'lucide-react'
import type { AppSettings } from '../types'
import { addDays, isWeekend } from '../utils/dateUtils'
import { getHolidayOrClosureInfo } from '../utils/holidays'

interface VacationRangeModalProps {
  isOpen: boolean
  defaultStartDate?: string
  settings: AppSettings
  onClose: () => void
  onSave: (startDate: string, endDate: string) => void
}

export const VacationRangeModal: React.FC<VacationRangeModalProps> = ({
  isOpen,
  defaultStartDate,
  settings,
  onClose,
  onSave,
}) => {
  const [startDate, setStartDate] = useState<string>(defaultStartDate || '')
  const [endDate, setEndDate] = useState<string>(defaultStartDate || '')

  // Calculate working days in selected range
  const workingDaysCount = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) return 0
    let count = 0
    let curr = startDate
    while (curr <= endDate) {
      if (!isWeekend(curr)) {
        const hInfo = getHolidayOrClosureInfo(curr, settings.customDates)
        if (!hInfo.isHoliday && !hInfo.isClosure) {
          count++
        }
      }
      curr = addDays(curr, 1)
    }
    return count
  }, [startDate, endDate, settings.customDates])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate || startDate > endDate) return
    onSave(startDate, endDate)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Palmtree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Marcar Férias</h3>
              <p className="text-xs text-slate-500">Regista férias para um intervalo de datas</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de início
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (!endDate || e.target.value > endDate) {
                    setEndDate(e.target.value)
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de fim
              </label>
              <input
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-800"
              />
            </div>
          </div>

          {/* Range summary info */}
          {startDate && endDate && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold text-amber-900">
                <span>Dias úteis abrangidos:</span>
                <span className="text-sm font-bold">{workingDaysCount} dias</span>
              </div>
              <p className="text-amber-800/80 text-[11px]">
                Fins de semana, feriados e encerramentos são automaticamente salvaguardados.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!startDate || !endDate || workingDaysCount === 0}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs"
            >
              Marcar {workingDaysCount} dias de férias
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
