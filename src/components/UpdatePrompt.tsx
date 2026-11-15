import React from 'react'
import { RefreshCw, WifiOff, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export const UpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh && !offlineReady) return null

  return (
    <div
      className="fixed bottom-4 inset-x-4 sm:left-auto sm:right-4 sm:w-96 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 flex items-start gap-3"
      role="status"
    >
      <div className={`p-2 rounded-xl shrink-0 ${needRefresh ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
        {needRefresh ? <RefreshCw className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
      </div>
      <div className="flex-1 text-sm">
        {needRefresh ? (
          <>
            <div className="font-bold text-slate-900">Atualização disponível</div>
            <p className="text-xs text-slate-600 mt-0.5">Os seus registos ficam guardados.</p>
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="mt-2 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              Atualizar agora
            </button>
          </>
        ) : (
          <>
            <div className="font-bold text-slate-900">Pronta para usar offline</div>
            <p className="text-xs text-slate-600 mt-0.5">Já pode abrir a app sem internet.</p>
          </>
        )}
      </div>
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => {
          setNeedRefresh(false)
          setOfflineReady(false)
        }}
        className="text-slate-400 hover:text-slate-600"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
