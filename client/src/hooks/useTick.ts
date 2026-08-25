import { useSyncExternalStore } from "react";

type Listener = () => void;

/**
 * Store that ticks on a fixed interval, shared across every subscriber using
 * the same interval so only one timer runs per interval value
 */
const createTickStore = (intervalMs: number) => {
  let tick = Date.now();
  const listeners = new Set<Listener>();
  let timer: ReturnType<typeof setInterval> | undefined;

  return {
    subscribe: (listener: Listener) => {
      if (listeners.size === 0) {
        timer = setInterval(() => {
          tick = Date.now();
          listeners.forEach((l) => l());
        }, intervalMs);
      }
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && timer) {
          clearInterval(timer);
          timer = undefined;
        }
      };
    },
    getSnapshot: () => tick,
  };
};

const tickStores = new Map<number, ReturnType<typeof createTickStore>>();

const getTickStore = (intervalMs: number) => {
  let store = tickStores.get(intervalMs);
  if (!store) {
    store = createTickStore(intervalMs);
    tickStores.set(intervalMs, store);
  }
  return store;
};

/**
 * Re-render the calling component every `intervalMs`, without forcing a
 * re-render of any parent or sibling component
 */
export const useTick = (intervalMs = 5000): number => {
  const store = getTickStore(intervalMs);
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
};
