import React from 'react'
import { AlertTriangle, Briefcase, CalendarClock, CheckCircle2, Compass, Info } from 'lucide-react'
import type { BalanceMetrics, ToleranceState } from '../types'

interface BalanceSummaryProps {
  balance: BalanceMetrics
  hasInitialBalance?: boolean
}

function getMainNoticeStyles(state: ToleranceState, isQuotaExhausted: boolean) {
  if (state === 'over_tolerance') {
    return {
      container: 'bg-rose-50 border-l-4 border-rose-500 text-rose-900',
      subtext: 'text-rose-700',
      icon: <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
    }
  }
  if (state === 'within_tolerance') {
    return {
      container: 'bg-amber-50 border-l-4 border-amber-500 text-amber-900',
      subtext: 'text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    }
  }
  if (isQuotaExhausted) {
    return {
      container: 'bg-amber-50 border-l-4 border-amber-400 text-amber-900',
      subtext: 'text-amber-800',
      icon: <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
    }
  }
  return {
    container: 'bg-emerald-50 border-l-4 border-emerald-500 text-emerald-900',
    subtext: 'text-emerald-700',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
  }
}

export const BalanceSummary: React.FC<BalanceSummaryProps> = ({ balance, hasInitialBalance }) => {
  const { tolerance } = balance
  const mainStyles = getMainNoticeStyles(tolerance.state, tolerance.isQuotaExhausted)

  return (
    <div className="space-y-3">
      {/* Main Tolerance Status Notice (based on used days) */}
      <div
        role="status"
        data-testid="tolerance-notice"
        data-tolerance-state={tolerance.state}
        className={`${mainStyles.container} px-4 py-3 rounded-xl flex items-start gap-3 shadow-2xs`}
      >
        {mainStyles.icon}
        <div className="min-w-0">
          <p className="text-sm font-bold leading-snug">{tolerance.message}</p>
          <p className={`text-xs mt-0.5 ${mainStyles.subtext}`}>
            Quota normal: {balance.quota} dias · Tolerância de 15%: +{tolerance.toleranceDays}{' '}
            {tolerance.toleranceDays === 1 ? 'dia' : 'dias'} (máximo {tolerance.maxDaysWithTolerance} dias)
          </p>
        </div>
      </div>

      {/* Future Plan Forecast Notice */}
      {tolerance.forecastMessage && (
        <div
          role="status"
          data-testid="tolerance-forecast-notice"
          data-forecast-state={tolerance.forecastState ?? ''}
          className={`${
            tolerance.forecastState === 'over_tolerance'
              ? 'bg-rose-50/90 border-l-4 border-rose-500 text-rose-900'
              : 'bg-amber-50/80 border-l-4 border-amber-400 text-amber-900'
          } px-4 py-3 rounded-xl flex items-start gap-3 shadow-2xs`}
        >
          {tolerance.forecastState === 'over_tolerance' ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CalendarClock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          )}
          <p className="text-xs sm:text-sm font-semibold leading-snug">{tolerance.forecastMessage}</p>
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
