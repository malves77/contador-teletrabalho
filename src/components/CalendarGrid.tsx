import React from 'react'
import { Building2, Laptop, Palmtree, Sparkles } from 'lucide-react'
import type { AppSettings, DayRecordsMap } from '../types'
import {
  DAY_NAMES_SHORT_PT,
  formatISODate,
  getDayOfWeek,
  getDaysInMonth,
  isWeekend,
} from '../utils/dateUtils'
import { getHolidayOrClosureInfo } from '../utils/holidays'

interface CalendarGridProps {
  year: number
  month: number
  today: string
  records: DayRecordsMap
  settings: AppSettings
  onSelectDay: (date: string) => void
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  year,
  month,
  today,
  records,
  settings,
  onSelectDay,
}) => {
  const totalDays = getDaysInMonth(year, month)

  // Find the day of the week for the 1st day of the month (1 = Mon ... 7 = Sun)
  const firstDayDateStr = formatISODate(year, month, 1)
  const firstDow = getDayOfWeek(firstDayDateStr) // 1 to 7

  // Padding cells before the 1st
  const paddingBefore = firstDow - 1

  const days: { day: number; dateStr: string }[] = []
  for (let d = 1; d <= totalDays; d++) {
    days.push({
      day: d,
      dateStr: formatISODate(year, month, d),
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center text-xs font-bold text-slate-500 py-2.5">
        {DAY_NAMES_SHORT_PT.map((name, i) => (
          <div key={name} className={i >= 5 ? 'text-slate-400' : 'text-slate-700'}>
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
        {/* Padding empty cells */}
        {Array.from({ length: paddingBefore }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[78px] sm:min-h-[96px] bg-slate-50/40" />
        ))}

        {/* Month Day cells */}
        {days.map(({ day, dateStr }) => {
          const weekend = isWeekend(dateStr)
          const dow = getDayOfWeek(dateStr)
          const holidayInfo = getHolidayOrClosureInfo(dateStr, settings.customDates)
          const isHabitualOffice = settings.habitualOfficeDays.includes(dow)
          const isToday = dateStr === today
          const record = records[dateStr]
          const isNonWorking = weekend || holidayInfo.isHoliday || holidayInfo.isClosure

          // Determine cell styling
          let cellBg = 'bg-white hover:bg-slate-50/80 cursor-pointer'
          if (weekend) {
            cellBg = 'bg-slate-50/60 cursor-default'
          } else if (holidayInfo.isHoliday) {
            cellBg = 'bg-purple-50/40 hover:bg-purple-50/70 cursor-pointer'
          } else if (holidayInfo.isClosure) {
            cellBg = 'bg-rose-50/40 hover:bg-rose-50/70 cursor-pointer'
          }

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDay(dateStr)}
              className={`min-h-[78px] sm:min-h-[96px] p-1.5 sm:p-2 flex flex-col justify-between text-left transition-all relative group ${cellBg} ${
                isToday ? 'ring-2 ring-indigo-500 ring-inset z-10' : ''
              }`}
            >
              {/* Day Number and Badges */}
              <div className="flex items-start justify-between w-full gap-1">
                <span
                  className={`text-xs sm:text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center shrink-0 ${
                    isToday
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : weekend
                      ? 'text-slate-400'
                      : 'text-slate-800'
                  }`}
                >
                  {day}
                </span>

                {/* Habitual or special badges */}
                <div className="flex flex-col items-end gap-0.5 truncate">
                  {!weekend && isHabitualOffice && !record && !holidayInfo.isHoliday && !holidayInfo.isClosure && (
                    <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline px-1 bg-slate-100 rounded">
                      Habitual
                    </span>
                  )}
                  {holidayInfo.isHoliday && (
                    <span
                      className="text-[9px] sm:text-[10px] font-bold text-purple-700 bg-purple-100/90 px-1 py-0.5 rounded truncate max-w-[65px] sm:max-w-[100px]"
                      title={holidayInfo.holidayName}
                    >
                      {holidayInfo.holidayName}
                    </span>
                  )}
                  {holidayInfo.isClosure && (
                    <span
                      className="text-[9px] sm:text-[10px] font-bold text-rose-700 bg-rose-100/90 px-1 py-0.5 rounded truncate max-w-[65px] sm:max-w-[100px]"
                      title={holidayInfo.closureName}
                    >
                      {holidayInfo.closureName}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="w-full mt-1">
                {record?.type === 'office' && (
                  <div className="flex items-center gap-1 w-full bg-blue-100/90 text-blue-800 px-1.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold shadow-2xs">
                    <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                    <span className="truncate">Escritório</span>
                  </div>
                )}

                {record?.type === 'telework' && (
                  <div className="flex items-center gap-1 w-full bg-emerald-100/90 text-emerald-800 px-1.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold shadow-2xs">
                    {record.source === 'plan' ? (
                      <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                    ) : (
                      <Laptop className="w-3 h-3 text-emerald-600 shrink-0" />
                    )}
                    <span className="truncate">
                      {record.source === 'plan' ? 'Plano TT' : 'Teletrabalho'}
                    </span>
                  </div>
                )}

                {record?.type === 'vacation' && (
                  <div className="flex items-center gap-1 w-full bg-amber-100/90 text-amber-900 px-1.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold shadow-2xs">
                    <Palmtree className="w-3 h-3 text-amber-600 shrink-0" />
                    <span className="truncate">Férias</span>
                  </div>
                )}

                {!record && !isNonWorking && (
                  <div className="text-[10px] text-slate-300 group-hover:text-slate-400 font-medium pl-1 sm:block hidden">
                    + Registar
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
