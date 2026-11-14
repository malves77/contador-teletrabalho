import { useState, useEffect, useMemo, useCallback } from 'react'
import type { AppSettings, DayRecord, DayRecordType, DayRecordsMap, SemesterInfo } from '../types'
import {
  getTodayLisbon,
  getSemesterInfo,
  getAdjacentSemester,
  splitISODate,
  addDays,
  isWeekend,
} from '../utils/dateUtils'
import { getHolidayOrClosureInfo } from '../utils/holidays'
import { calculateSemesterBalance } from '../utils/balance'
import { loadRecords, loadSettings, saveRecords, saveSettings } from '../utils/storage'

export interface UndoOfficeAction {
  date: string
  previousRecord: DayRecord | null
}

export interface UseContadorStateOptions {
  initialToday?: string
  initialSettings?: AppSettings
  initialRecords?: DayRecordsMap
}

export function useContadorState(options: UseContadorStateOptions = {}) {
  const [today, setToday] = useState<string>(() => options.initialToday || getTodayLisbon())

  const [settings, setSettings] = useState<AppSettings>(() => {
    if (options.initialSettings) return options.initialSettings
    return loadSettings()
  })

  const [records, setRecords] = useState<DayRecordsMap>(() => {
    if (options.initialRecords) return options.initialRecords
    return loadRecords()
  })

  // Selected semester: defaults to the semester of "today"
  const [currentSemester, setCurrentSemester] = useState<SemesterInfo>(() => {
    return getSemesterInfo(today)
  })

  // Active month being viewed in calendar: defaults to month of "today"
  const [activeMonth, setActiveMonthState] = useState<{ year: number; month: number }>(() => {
    const { year, month } = splitISODate(today)
    return { year, month }
  })

  // Undo state for "Estou no escritório"
  const [lastOfficeAction, setLastOfficeAction] = useState<UndoOfficeAction | null>(null)

  // Persist settings whenever changed
  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  // Persist records whenever changed
  useEffect(() => {
    saveRecords(records)
  }, [records])

  // Calculate balance metrics for the currently selected semester
  const balance = useMemo(() => {
    return calculateSemesterBalance(currentSemester, records, settings, today)
  }, [currentSemester, records, settings, today])

  // Navigation handlers
  const setMonth = useCallback((year: number, month: number) => {
    setActiveMonthState({ year, month })
    const sem = getSemesterInfo(year, month <= 6 ? 1 : 2)
    setCurrentSemester(sem)
  }, [])

  const nextMonth = useCallback(() => {
    setActiveMonthState((prev) => {
      let nextY = prev.year
      let nextM = prev.month + 1
      if (nextM > 12) {
        nextM = 1
        nextY += 1
      }
      const sem = getSemesterInfo(nextY, nextM <= 6 ? 1 : 2)
      setCurrentSemester(sem)
      return { year: nextY, month: nextM }
    })
  }, [])

  const prevMonth = useCallback(() => {
    setActiveMonthState((prev) => {
      let prevY = prev.year
      let prevM = prev.month - 1
      if (prevM < 1) {
        prevM = 12
        prevY -= 1
      }
      const sem = getSemesterInfo(prevY, prevM <= 6 ? 1 : 2)
      setCurrentSemester(sem)
      return { year: prevY, month: prevM }
    })
  }, [])

  const goToToday = useCallback(() => {
    const { year, month } = splitISODate(today)
    setActiveMonthState({ year, month })
    setCurrentSemester(getSemesterInfo(today))
  }, [today])

  const setSemester = useCallback((semester: SemesterInfo) => {
    setCurrentSemester(semester)
    const startM = semester.semester === 1 ? 1 : 7
    setActiveMonthState({ year: semester.year, month: startM })
  }, [])

  const nextSemester = useCallback(() => {
    const nextSem = getAdjacentSemester(currentSemester, 1)
    setSemester(nextSem)
  }, [currentSemester, setSemester])

  const prevSemester = useCallback(() => {
    const prevSem = getAdjacentSemester(currentSemester, -1)
    setSemester(prevSem)
  }, [currentSemester, setSemester])

  // Information about today
  const todayInfo = useMemo(() => {
    const weekend = isWeekend(today)
    const holidayClosure = getHolidayOrClosureInfo(today, settings.customDates)
    const isNonWorking = weekend || holidayClosure.isHoliday || holidayClosure.isClosure
    const currentRecord = records[today]
    return {
      date: today,
      isWeekend: weekend,
      isHoliday: holidayClosure.isHoliday,
      holidayName: holidayClosure.holidayName,
      isClosure: holidayClosure.isClosure,
      closureName: holidayClosure.closureName,
      isNonWorking,
      currentRecord,
      isOffice: currentRecord?.type === 'office',
      isTelework: currentRecord?.type === 'telework',
      isVacation: currentRecord?.type === 'vacation',
    }
  }, [today, settings.customDates, records])

  // "Estou no escritório" action
  const markTodayOffice = useCallback(
    (options?: { force?: boolean }): { status: 'success' | 'blocked' | 'needs_confirmation'; message?: string } => {
      if (todayInfo.isNonWorking) {
        let reason = 'Fim de semana'
        if (todayInfo.isHoliday) reason = todayInfo.holidayName || 'Feriado'
        if (todayInfo.isClosure) reason = todayInfo.closureName || 'Encerramento da empresa'
        return {
          status: 'blocked',
          message: `Hoje não é dia útil (${reason}).`,
        }
      }

      const existing = records[today]

      if (existing?.type === 'vacation' && !options?.force) {
        return {
          status: 'needs_confirmation',
          message: 'Hoje está marcado como Férias. Deseja substituir pelo registo de Escritório?',
        }
      }

      // Save previous record for undo
      setLastOfficeAction({
        date: today,
        previousRecord: existing ? { ...existing } : null,
      })

      // Update record to office
      setRecords((prev) => ({
        ...prev,
        [today]: {
          date: today,
          type: 'office',
          source: 'manual',
          updatedAt: new Date().toISOString(),
        },
      }))

      return { status: 'success' }
    },
    [today, todayInfo, records]
  )

  // Undo "Estou no escritório"
  const undoLastOffice = useCallback(() => {
    if (!lastOfficeAction) return

    const { date, previousRecord } = lastOfficeAction

    setRecords((prev) => {
      const next = { ...prev }
      if (previousRecord) {
        next[date] = previousRecord
      } else {
        delete next[date]
      }
      return next
    })

    setLastOfficeAction(null)
  }, [lastOfficeAction])

  // Set or clear record for any specific date
  const setDayRecord = useCallback((date: string, type: DayRecordType | null) => {
    setRecords((prev) => {
      const next = { ...prev }
      if (type === null) {
        delete next[date]
      } else {
        next[date] = {
          date,
          type,
          source: 'manual',
          updatedAt: new Date().toISOString(),
        }
      }
      return next
    })
  }, [])

  // Mark vacation range
  const markVacationRange = useCallback(
    (startDate: string, endDate: string): number => {
      let count = 0
      setRecords((prev) => {
        const next = { ...prev }
        let curr = startDate
        while (curr <= endDate) {
          if (!isWeekend(curr)) {
            const hInfo = getHolidayOrClosureInfo(curr, settings.customDates)
            if (!hInfo.isHoliday && !hInfo.isClosure) {
              next[curr] = {
                date: curr,
                type: 'vacation',
                source: 'manual',
                updatedAt: new Date().toISOString(),
              }
              count++
            }
          }
          curr = addDays(curr, 1)
        }
        return next
      })
      return count
    },
    [settings.customDates]
  )

  // Apply plan
  const applyPlan = useCallback((proposedDates: string[]) => {
    setRecords((prev) => {
      const next = { ...prev }
      for (const d of proposedDates) {
        // preserve manual records if any, otherwise mark as telework
        if (!next[d]) {
          next[d] = {
            date: d,
            type: 'telework',
            source: 'plan',
            updatedAt: new Date().toISOString(),
          }
        }
      }
      return next
    })
  }, [])

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<AppSettings> | ((prev: AppSettings) => AppSettings)) => {
    setSettings((prev) => {
      if (typeof newSettings === 'function') {
        return newSettings(prev)
      }
      return { ...prev, ...newSettings }
    })
  }, [])

  return {
    today,
    setToday,
    currentSemester,
    activeMonth,
    settings,
    records,
    balance,
    todayInfo,
    lastOfficeAction,
    // Actions
    setMonth,
    nextMonth,
    prevMonth,
    goToToday,
    setSemester,
    nextSemester,
    prevSemester,
    markTodayOffice,
    undoLastOffice,
    setDayRecord,
    markVacationRange,
    applyPlan,
    updateSettings,
  }
}
