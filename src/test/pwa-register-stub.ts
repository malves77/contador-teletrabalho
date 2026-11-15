// Substitui o módulo virtual do vite-plugin-pwa nos testes (jsdom não tem service worker).
export function useRegisterSW() {
  const noop = () => {}
  return {
    needRefresh: [false, noop] as [boolean, (v: boolean) => void],
    offlineReady: [false, noop] as [boolean, (v: boolean) => void],
    updateServiceWorker: async () => {},
  }
}
