import { useState } from 'react'
import { Header } from './components/Header'
import { QuickOfficeButton } from './components/QuickOfficeButton'
import { BalanceSummary } from './components/BalanceSummary'
import { AutoCloseBanner } from './components/AutoCloseBanner'
import { MonthNavigator } from './components/MonthNavigator'
import { CalendarGrid } from './components/CalendarGrid'
import { Legend } from './components/Legend'
import { DayModal } from './components/DayModal'
import { VacationRangeModal } from './components/VacationRangeModal'
import { PlanModal } from './components/PlanModal'
import { SettingsModal } from './components/SettingsModal'
import { ConfirmDialog } from './components/ConfirmDialog'
import { useContadorState } from './hooks/useContadorState'

export function App() {
  const {
    today,
    currentSemester,
    activeMonth,
    settings,
    records,
    balance,
    todayInfo,
    lastOfficeAction,
    autoCloseNotification,
    dismissAutoCloseNotification,
    prevMonth,
    nextMonth,
    goToToday,
    prevSemester,
    nextSemester,
    markTodayOffice,
    undoLastOffice,
    setDayRecord,
    markVacationRange,
    applyPlan,
    updateSettings,
  } = useContadorState()

  // Modal visibility states
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [confirmVacationReplaceOpen, setConfirmVacationReplaceOpen] = useState(false)

  // Handle Quick Office click
  const handleQuickOfficeClick = () => {
    const result = markTodayOffice()
    if (result.status === 'needs_confirmation') {
      setConfirmVacationReplaceOpen(true)
    }
  }

  // Handle confirmed office mark when day was vacation
  const handleConfirmVacationReplace = () => {
    markTodayOffice({ force: true })
    setConfirmVacationReplaceOpen(false)
  }

  const currentSemesterInitial = settings.initialBalances[currentSemester.key]
  const hasInitialBalance = !!(currentSemesterInitial && currentSemesterInitial.enabled)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Header with Semester Selector & Settings */}
      <Header
        currentSemester={currentSemester}
        onPrevSemester={prevSemester}
        onNextSemester={nextSemester}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Weekly Auto-Close Summary Notification */}
        <AutoCloseBanner
          message={autoCloseNotification}
          onDismiss={dismissAutoCloseNotification}
        />

        {/* 2. Top area: Quick Office Button + Balance Summary */}
        <section className="space-y-3.5">
          {/* Quick Action Button - Prominent & mobile-first */}
          <QuickOfficeButton
            today={today}
            todayInfo={todayInfo}
            lastOfficeAction={lastOfficeAction}
            onMarkOffice={handleQuickOfficeClick}
            onUndo={undoLastOffice}
          />

          {/* Balance Summary Cards */}
          <BalanceSummary balance={balance} hasInitialBalance={hasInitialBalance} />
        </section>

        {/* 3. Monthly Calendar & Controls */}
        <section className="space-y-3">
          {/* Month Navigator with Action Buttons */}
          <MonthNavigator
            year={activeMonth.year}
            month={activeMonth.month}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onGoToToday={goToToday}
            onOpenPlan={() => setIsPlanModalOpen(true)}
            onOpenVacation={() => setIsVacationModalOpen(true)}
          />

          {/* Calendar Grid */}
          <CalendarGrid
            year={activeMonth.year}
            month={activeMonth.month}
            today={today}
            records={records}
            settings={settings}
            onSelectDay={(date) => setSelectedDay(date)}
          />

          {/* Calendar Legend */}
          <Legend />
        </section>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 mt-auto">
        Contador de Teletrabalho · Dados guardados localmente no seu dispositivo
      </footer>

      {/* Modals & Dialogs */}
      {/* Day Edit Modal */}
      <DayModal
        date={selectedDay}
        currentRecord={selectedDay ? records[selectedDay] : undefined}
        settings={settings}
        onClose={() => setSelectedDay(null)}
        onSave={(date, type) => setDayRecord(date, type)}
      />

      {/* Vacation Range Modal */}
      <VacationRangeModal
        isOpen={isVacationModalOpen}
        defaultStartDate={today}
        settings={settings}
        onClose={() => setIsVacationModalOpen(false)}
        onSave={(startDate, endDate) => markVacationRange(startDate, endDate)}
      />

      {/* Plan Distribution Preview & Apply Modal */}
      <PlanModal
        isOpen={isPlanModalOpen}
        semester={currentSemester}
        records={records}
        settings={settings}
        balance={balance}
        today={today}
        onClose={() => setIsPlanModalOpen(false)}
        onApply={(dates) => applyPlan(dates)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        settings={settings}
        currentSemester={currentSemester}
        onClose={() => setIsSettingsModalOpen(false)}
        onSave={(updated) => updateSettings(updated)}
      />

      {/* Confirm Vacation Replacement Dialog */}
      <ConfirmDialog
        isOpen={confirmVacationReplaceOpen}
        title="Substituir Férias por Escritório?"
        message="A data de hoje está atualmente marcada como Férias. Deseja substituir esse registo por Escritório?"
        confirmText="Sim, substituir"
        cancelText="Manter Férias"
        onConfirm={handleConfirmVacationReplace}
        onCancel={() => setConfirmVacationReplaceOpen(false)}
      />
    </div>
  )
}

export default App
