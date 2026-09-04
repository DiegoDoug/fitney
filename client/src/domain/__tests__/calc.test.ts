import {
  epleyE1rmKg,
  setVolumeKg,
  sessionVolumeKg,
  countsTowardVolume,
  E1RM_MIN_REPS,
  E1RM_MAX_REPS,
} from '@/domain/calc';
import { roundTo, snapToIncrement, kgToLb, lbToKg } from '@/domain/units';

describe('domain/calc', () => {
  it('e1RM is null outside reps [2,10] and for invalid load (DATA-06)', () => {
    expect(epleyE1rmKg(100, 1)).toBeNull();
    expect(epleyE1rmKg(100, 0)).toBeNull();
    expect(epleyE1rmKg(100, 11)).toBeNull();
    expect(epleyE1rmKg(null, 5)).toBeNull();
    expect(epleyE1rmKg(100, null)).toBeNull();
    expect(epleyE1rmKg(-5, 5)).toBeNull();
    expect(epleyE1rmKg(100, E1RM_MIN_REPS)).not.toBeNull();
    expect(epleyE1rmKg(100, E1RM_MAX_REPS)).not.toBeNull();
  });

  it('e1RM rounds to 4dp half-up like Postgres round(numeric,4)', () => {
    expect(epleyE1rmKg(102.5, 8)).toBe(129.8333);
    expect(epleyE1rmKg(100, 5)).toBe(116.6667);
    expect(epleyE1rmKg(60, 3)).toBe(66);
  });

  it('set + session volume: missing load/reps count as 0; warmups excluded', () => {
    expect(setVolumeKg(100, 5)).toBe(500);
    expect(setVolumeKg(null, 5)).toBe(0);
    expect(setVolumeKg(100, null)).toBe(0);
    const sets = [
      { set_type: 'working' as const, load_kg: 100, reps: 5, completed: true },
      { set_type: 'warmup' as const, load_kg: 40, reps: 10, completed: true },
      { set_type: 'working' as const, load_kg: 100, reps: 5, completed: false }, // not completed
      { set_type: 'backoff' as const, load_kg: 80, reps: 8, completed: true },
    ];
    expect(sessionVolumeKg(sets)).toBe(500 + 640);
    expect(countsTowardVolume(sets[1]!)).toBe(false); // warmup
    expect(countsTowardVolume(sets[2]!)).toBe(false); // incomplete
  });
});

describe('domain/units', () => {
  it('roundTo is half-up and float-safe', () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(2.5, 0)).toBe(3);
    expect(roundTo(102.5 * (1 + 8 / 30), 4)).toBe(129.8333);
  });
  it('lb<->kg round-trips within tolerance', () => {
    expect(kgToLb(lbToKg(225))).toBeCloseTo(225, 6);
  });
  it('snapToIncrement snaps to the nearest plate step; increment 0 is a no-op', () => {
    expect(snapToIncrement(101.3, 2.5)).toBe(102.5); // nearest 2.5
    expect(snapToIncrement(100.9, 2.5)).toBe(100);
    expect(snapToIncrement(101.3, 0)).toBe(101.3);
  });
});
