/**
 * App runtime context — exposes the composition-root container + auth state to
 * screens. Screens read this; they never import data/* directly (ADR-0002).
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { buildContainer, type AppContainer } from './container';

type RuntimeState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'ready'; userId: string; container: AppContainer };

const RuntimeContext = createContext<RuntimeState>({ status: 'loading' });

export function useRuntime(): RuntimeState {
  return useContext(RuntimeContext);
}

export function useContainer(): AppContainer {
  const s = useRuntime();
  if (s.status !== 'ready') throw new Error('container not ready');
  return s.container;
}

/**
 * Boots the container once a userId is known. Auth wiring (Supabase session ->
 * userId) lands with the auth slice; for now `initialUserId` can be injected
 * (dev) or the app shows the signed-out state.
 */
export function RuntimeProvider({
  initialUserId,
  children,
}: {
  initialUserId?: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<RuntimeState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    if (!initialUserId) {
      setState({ status: 'signed-out' });
      return;
    }
    void buildContainer(initialUserId).then((container) => {
      if (cancelled) return;
      setState({ status: 'ready', userId: initialUserId, container });
      // fire-and-forget first sync (never blocks the UI)
      void container.sync.requestSync('cold-start').catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [initialUserId]);

  return <RuntimeContext.Provider value={state}>{children}</RuntimeContext.Provider>;
}
