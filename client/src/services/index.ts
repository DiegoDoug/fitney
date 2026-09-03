/**
 * Services container — interfaces + swappable impls, injected at the app root
 * (system-architecture.md §6.4). domain/features stay testable with fakes.
 */
export * from './clock';
export * from './ids';
export * from './connectivity';
export * from './logger';
export * from './analytics';
export * from './config';
export * from './haptics';
export * from './unit-formatter';

import type { Clock } from './clock';
import type { IdGenerator } from './ids';
import type { Connectivity } from './connectivity';
import type { Logger } from './logger';
import type { Analytics } from './analytics';
import type { Config } from './config';
import type { Haptics } from './haptics';

export type Services = {
  clock: Clock;
  ids: IdGenerator;
  connectivity: Connectivity;
  logger: Logger;
  analytics: Analytics;
  config: Config;
  haptics: Haptics;
};
