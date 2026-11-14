import React from 'react'
import { AlertTriangle, Briefcase, CalendarClock, CheckCircle2, Compass } from 'lucide-react'
import type { BalanceMetrics } from '../types'

interface BalanceSummaryProps {
  balance: BalanceMetrics
  hasInitialBalance?: boolean
}

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({ balance, hasInitialBalance }) => {
  return (
    <div className="space-y-3">
      {/* Exceeded Quota Alert */}
      {balance.isOverQuota && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-900">Limite de quota ultrapassado</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              O total de teletrabalho (usados + planeados) ultrapassa a quota em{' '}
              <span className="font-bold">{balance.overQuotaDays} dia{balance.overQuotaDays > 1 ? 's' : ''}</span>.
            </p>
          </div>
        </div>
      )}

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Dias usados */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Dias usados</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {balance.usedDays}
            </span>
            <span className="text-xs font-medium text-slate-500">/ {balance.quota} dias</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {hasInitialBalance ? 'Saldo inicial + teletrabalho até hoje' : 'Teletrabalho registado até hoje'}
          </p>
        </div>

        {/* 2. Dias planeados */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Dias planeados</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
              {balance.plannedDays}
            </span>
            <span className="text-xs font-medium text-slate-500">dias</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Teletrabalho com data posterior a hoje</p>
        </div>

        {/* 3. Saldo atual */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo atual</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold ${
                balance.currentBalance < 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {balance.currentBalance}
            </span>
            <span className="text-xs font-medium text-slate-500">dias</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Quota menos dias usados</p>
        </div>

        {/* 4. Saldo após o plano */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo após plano</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold ${
                balance.afterPlanBalance < 0 ? 'text-rose-600' : 'text-blue-600'
              }`}
            >
              {balance.afterPlanBalance}
            </span>
            <span className="text-xs font-medium text-slate-500">dias</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Saldo atual menos dias planeados</p>
        </div>
      </div>
    </div>
  )
}
