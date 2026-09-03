/**
 * Connectivity — a hint only. The write path NEVER consults this (offline-first,
 * NFR-OFFLINE); the sync scheduler uses it to decide whether a push attempt is
 * worth making and to wake on restoration (SPEC §11.1).
 */
export type ConnectivityState = 'online' | 'offline' | 'unknown';

export interface Connectivity {
  current(): ConnectivityState;
  /** returns an unsubscribe fn */
  subscribe(listener: (s: ConnectivityState) => void): () => void;
}

export function fakeConnectivity(initial: ConnectivityState = 'online'): Connectivity & {
  set(s: ConnectivityState): void;
} {
  let state = initial;
  const listeners = new Set<(s: ConnectivityState) => void>();
  return {
    current: () => state,
    subscribe: (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    set: (s) => {
      state = s;
      for (const l of listeners) l(s);
    },
  };
}
