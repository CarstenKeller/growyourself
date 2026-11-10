/**
 * All thresholds of the rule set in one place (Plan.md, section 2).
 * Values marked "assumption" are set values, not research results (Plan.md 1).
 */
export const PARAMS = {
  /** Local time at which a new day begins (hours, minutes). Before that, it is still the previous day. */
  DAY_CUTOFF_HOUR: 3,
  DAY_CUTOFF_MINUTE: 0,

  /** A forgotten check-in can be backfilled this many days back (only within the current, unsettled week). */
  CHECKIN_BACKFILL_DAYS: 2,

  /** Status levels a settled balanced week moves up. */
  RECOVERY_STEP: 1,

  /** Consecutive successful days after which the wind clears the fallen leaves (assumption). */
  WIND_STREAK: 7,

  /** Completion: minimum leaves on the tree (assumption, Plan.md 1). */
  MIN_LEAVES: 42,

  /** SRBAI is asked weekly from this number of leaves on. */
  SRBAI_START_LEAVES: 35,

  /**
   * SRBAI scale and threshold.
   * UNVERIFIED: wording, scale and German translation must be checked against
   * the source (Gardner et al. 2012) before Phase 7. Placeholder values only.
   */
  SRBAI_ITEM_COUNT: 4,
  SRBAI_SCALE_MIN: 1,
  SRBAI_SCALE_MAX: 7,
  SRBAI_THRESHOLD: 5,

  /** Visible vitality per status level (healthy, slowed, stagnating, wilting). Only wilting lowers it (Plan.md 2.4). */
  VITALITY_BY_LEVEL: [1, 1, 1, 0.5] as const,
} as const;

export type Params = typeof PARAMS;
