import React from 'react'
import { CalendarCheck2, X } from 'lucide-react'

interface AutoCloseBannerProps {
  message: string | null
  onDismiss: () => void
}

export const AutoCloseBanner: React.FC<AutoCloseBannerProps> = ({ message, onDismiss }) => {
  if (!message) return null

  return (
    <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200/90 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <CalendarCheck2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-emerald-950 flex items-center gap-2">
            <span>{message}</span>
          </div>
          <p className="text-xs text-emerald-800/80 mt-0.5">
            Pode corrigir ou alterar qualquer dia diretamente tocando no calendário abaixo.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-emerald-100/50 rounded-lg transition-colors shrink-0"
        aria-label="Fechar notificação"
        title="Fechar resumo"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
