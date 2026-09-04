/**
 * Logger — structured, level-based. The logging (workout) path never throws to
 * the UI (NFR-RELIABILITY); errors there are caught and routed here.
 * No tokens, credentials, private notes, or full workout payloads (CLAUDE.md, CON-9).
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  log(level: LogLevel, event: string, data?: Record<string, unknown>): void;
}

export const consoleLogger: Logger = {
  log(level, event, data) {
    const line = { level, event, ...(data ?? {}) };
    // eslint-disable-next-line no-console
    (console[level] ?? console.log)(JSON.stringify(line));
  },
};

export const noopLogger: Logger = { log: () => {} };

export function collectingLogger(): Logger & { entries: Array<{ level: LogLevel; event: string; data?: Record<string, unknown> }> } {
  const entries: Array<{ level: LogLevel; event: string; data?: Record<string, unknown> }> = [];
  return {
    entries,
    log: (level, event, data) => {
      entries.push({ level, event, ...(data ? { data } : {}) });
    },
  };
}
