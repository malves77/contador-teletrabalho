import React from 'react'
import { Calendar, ChevronLeft, ChevronRight, Palmtree, Sparkles } from 'lucide-react'
import { getMonthNamePT } from '../utils/dateUtils'

interface MonthNavigatorProps {
  year: number
  month: number
  onPrevMonth: () => void
  onNextMonth: () => void
  onGoToToday: () => void
  onOpenPlan: () => void
  onOpenVacation: () => void
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  onOpenPlan,
  onOpenVacation,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Month Navigator */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Mês anterior"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 min-w-[190px] text-center">
            {getMonthNamePT(month)} <span className="font-medium text-slate-500">{year}</span>
          </h2>
          <button
            onClick={onNextMonth}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Próximo mês"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={onGoToToday}
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          title="Saltar para o mês atual"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Hoje</span>
        </button>
      </div>

      {/* Action Buttons: Distribuir dias restantes & Marcar férias */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        <button
          onClick={onOpenVacation}
          className="flex-1 md:flex-none px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          title="Marcar férias para um intervalo de datas"
        >
          <Palmtree className="w-4 h-4 text-amber-600" />
          <span>Marcar férias</span>
        </button>

        <button
          onClick={onOpenPlan}
          className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-100 active:scale-[0.98]"
          title="Distribuir dias restantes até ao fim do semestre"
        >
          <Sparkles className="w-4 h-4" />
          <span>Distribuir dias restantes</span>
        </button>
      </div>
    </div>
  )
}
