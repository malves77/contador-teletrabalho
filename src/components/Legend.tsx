import React from 'react'
import { Building2, Laptop, Palmtree } from 'lucide-react'

export const Legend: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-xs text-slate-600 font-medium">
        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mr-1">
          Legenda:
        </span>

        {/* Escritório */}
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-blue-100 border border-blue-300 flex items-center justify-center">
            <Building2 className="w-2.5 h-2.5 text-blue-700" />
          </span>
          <span>Escritório</span>
        </div>

        {/* Teletrabalho */}
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-300 flex items-center justify-center">
            <Laptop className="w-2.5 h-2.5 text-emerald-700" />
          </span>
          <span>Teletrabalho</span>
        </div>

        {/* Férias */}
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300 flex items-center justify-center">
            <Palmtree className="w-2.5 h-2.5 text-amber-700" />
          </span>
          <span>Férias</span>
        </div>

        {/* Habitual Escritório */}
        <div className="flex items-center gap-1.5">
          <span className="px-1 py-0.2 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500">
            Habitual
          </span>
          <span>Dia habitual de escritório</span>
        </div>

        {/* Feriado */}
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-purple-100 border border-purple-300" />
          <span>Feriado</span>
        </div>

        {/* Encerramento */}
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-rose-100 border border-rose-300" />
          <span>Encerramento</span>
        </div>

        {/* Fim de semana */}
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200" />
          <span>Fim de semana</span>
        </div>
      </div>
    </div>
  )
}
