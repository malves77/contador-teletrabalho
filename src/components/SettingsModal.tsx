import React, { useState } from 'react'
import { Settings as SettingsIcon, X, Plus, Trash2, Check } from 'lucide-react'
import type { AppSettings, CustomDateItem, SemesterInfo } from '../types'
import { DAY_NAMES_FULL_PT, formatDatePT } from '../utils/dateUtils'

interface SettingsModalProps {
  isOpen: boolean
  settings: AppSettings
  currentSemester: SemesterInfo
  onClose: () => void
  onSave: (updated: AppSettings) => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  currentSemester,
  onClose,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings)

  // Current semester initial balance state
  const semesterKey = currentSemester.key
  const currentInit = localSettings.initialBalances[semesterKey] || {
    usedDays: 0,
    cutOffDate: '',
    enabled: false,
  }

  // New custom holiday or closure form state
  const [newCustomDate, setNewCustomDate] = useState('')
  const [newCustomName, setNewCustomName] = useState('')
  const [newCustomType, setNewCustomType] = useState<'holiday' | 'closure'>('holiday')

  if (!isOpen) return null

  // Handle quota change
  const handleQuotaChange = (value: number) => {
    setLocalSettings((prev) => ({
      ...prev,
      quota: Math.max(0, value),
    }))
  }

  // Handle habitual office day toggle (1=Mon ... 5=Fri)
  const toggleHabitualDay = (dayIndex: number) => {
    setLocalSettings((prev) => {
      const exists = prev.habitualOfficeDays.includes(dayIndex)
      const updated = exists
        ? prev.habitualOfficeDays.filter((d) => d !== dayIndex)
        : [...prev.habitualOfficeDays, dayIndex].sort()
      return {
        ...prev,
        habitualOfficeDays: updated,
      }
    })
  }

  // Handle initial balance change
  const handleInitialBalanceChange = (field: 'usedDays' | 'cutOffDate' | 'enabled', val: any) => {
    setLocalSettings((prev) => {
      const existing = prev.initialBalances[semesterKey] || {
        usedDays: 0,
        cutOffDate: '',
        enabled: false,
      }
      return {
        ...prev,
        initialBalances: {
          ...prev.initialBalances,
          [semesterKey]: {
            ...existing,
            [field]: val,
          },
        },
      }
    })
  }

  // Handle adding custom holiday or closure
  const handleAddCustomDate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustomDate || !newCustomName.trim()) return

    const newItem: CustomDateItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: newCustomDate,
      name: newCustomName.trim(),
      type: newCustomType,
    }

    setLocalSettings((prev) => ({
      ...prev,
      customDates: [...prev.customDates, newItem].sort((a, b) => a.date.localeCompare(b.date)),
    }))

    setNewCustomDate('')
    setNewCustomName('')
  }

  // Handle deleting custom date
  const handleDeleteCustomDate = (id: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      customDates: prev.customDates.filter((item) => item.id !== id),
    }))
  }

  const handleSaveAndClose = () => {
    onSave(localSettings)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Definições da Aplicação</h3>
              <p className="text-xs text-slate-500">Configurações globais e por semestre</p>
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* 1. Quota semestral */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Quota de Teletrabalho por Semestre
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="180"
                value={localSettings.quota}
                onChange={(e) => handleQuotaChange(parseInt(e.target.value, 10) || 0)}
                className="w-28 px-3 py-2 text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
              <span className="text-xs text-slate-500 font-medium">dias por semestre (padrão: 60)</span>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 2. Dias habituais de escritório */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Dias Habituais de Escritório
            </label>
            <p className="text-xs text-slate-500">
              Dias da semana em que normalmente trabalha no escritório (padrão: Segunda e Quinta).
              Estes dias são preservados e excluídos pelo gerador automático do plano de teletrabalho.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((dayIdx) => {
                const isSelected = localSettings.habitualOfficeDays.includes(dayIdx)
                const name = DAY_NAMES_FULL_PT[dayIdx].replace('-feira', '')
                return (
                  <button
                    key={dayIdx}
                    type="button"
                    onClick={() => toggleHabitualDay(dayIdx)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 3. Saldo inicial com data de corte para o semestre atual */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Saldo Inicial com Data de Corte
                </span>
                <span className="ml-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {currentSemester.label}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentInit.enabled}
                  onChange={(e) => handleInitialBalanceChange('enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Permite introduzir, por exemplo: «42 dias de teletrabalho usados até 31 de outubro de 2026».
              Esse valor inclui o próprio dia de corte. A app soma apenas os registos posteriores a essa data.
            </p>

            {currentInit.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dias usados no corte
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={localSettings.quota}
                    value={currentInit.usedDays}
                    onChange={(e) =>
                      handleInitialBalanceChange('usedDays', parseInt(e.target.value, 10) || 0)
                    }
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de corte
                  </label>
                  <input
                    type="date"
                    min={currentSemester.startDate}
                    max={currentSemester.endDate}
                    value={currentInit.cutOffDate}
                    onChange={(e) => handleInitialBalanceChange('cutOffDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* 4. Feriados Adicionais e Dias de Encerramento */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Feriados Adicionais e Encerramentos
              </label>
              <span className="text-xs text-slate-400">
                {localSettings.customDates.length} registado(s)
              </span>
            </div>

            {/* List of custom items */}
            {localSettings.customDates.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {localSettings.customDates.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.type === 'holiday'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {item.type === 'holiday' ? 'Feriado' : 'Encerramento'}
                      </span>
                      <span className="font-semibold text-slate-800">{item.name}</span>
                      <span className="text-slate-400">({formatDatePT(item.date)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomDate(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new custom date form */}
            <form onSubmit={handleAddCustomDate} className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-2.5">
              <span className="text-xs font-semibold text-slate-700 block">
                Acrescentar novo dia
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="date"
                  required
                  value={newCustomDate}
                  onChange={(e) => setNewCustomDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                />
                <input
                  type="text"
                  required
                  placeholder="Nome do dia (ex: Ponte de Natal)"
                  value={newCustomName}
                  onChange={(e) => setNewCustomName(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                />
                <div className="flex items-center gap-1.5">
                  <select
                    value={newCustomType}
                    onChange={(e) => setNewCustomType(e.target.value as 'holiday' | 'closure')}
                    className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 flex-1"
                  >
                    <option value="holiday">Feriado Adicional</option>
                    <option value="closure">Encerramento</option>
                  </select>
                  <button
                    type="submit"
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shrink-0"
                    title="Adicionar"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Guardar alterações</span>
          </button>
        </div>
      </div>
    </div>
  )
}
