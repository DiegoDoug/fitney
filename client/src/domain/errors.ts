/** Typed domain errors. features/* map these to UX §10 states; the logging
 *  path never lets one propagate as an uncaught throw (NFR-RELIABILITY). */
export class DomainError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super('validation', message);
    this.name = 'ValidationError';
  }
}

/** Attempt to start a second active session (FR-LOG-12). */
export class ActiveSessionExistsError extends DomainError {
  readonly activeSessionId: string;
  constructor(activeSessionId: string) {
    super('active_session_exists', 'An active session already exists');
    this.name = 'ActiveSessionExistsError';
    this.activeSessionId = activeSessionId;
  }
}

/** A local write committed but could not persist — Finish is blocked (AR-DEC-10). */
export class PersistFailedError extends DomainError {
  constructor(message = 'Not saved — retrying') {
    super('persist_failed', message);
    this.name = 'PersistFailedError';
  }
}
