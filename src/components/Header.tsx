import React from 'react'
import { Calendar, ChevronLeft, ChevronRight, Settings as SettingsIcon } from 'lucide-react'
import type { SemesterInfo } from '../types'

interface HeaderProps {
  currentSemester: SemesterInfo
  onPrevSemester: () => void
  onNextSemester: () => void
  onOpenSettings: () => void
}

export const Header: React.FC<HeaderProps> = ({
  currentSemester,
  onPrevSemester,
  onNextSemester,
  onOpenSettings,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Title */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-100">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
              Contador de Teletrabalho
            </h1>
            <p className="text-xs text-slate-500 font-medium">Gestão de quota e planeamento semestral</p>
          </div>
        </div>

        {/* Semester Navigator & Settings */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={onPrevSemester}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
              title="Semestre anterior"
              aria-label="Semestre anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-semibold text-slate-800 whitespace-nowrap">
              {currentSemester.label}
            </span>
            <button
              onClick={onNextSemester}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
              title="Próximo semestre"
              aria-label="Próximo semestre"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs hover:border-slate-300"
            title="Definições"
          >
            <SettingsIcon className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Definições</span>
          </button>
        </div>
      </div>
    </header>
  )
}
