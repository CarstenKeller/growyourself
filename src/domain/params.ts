/**
 * All thresholds of the rule set in one place (Plan.md, section 2).
 * Values marked "assumption" are set values, not research results (Plan.md 1).
 */
export const PARAMS = {
  /** Local time at which a new day begins (hours, minutes). Before that, it is still the previous day. */
  DAY_CUTOFF_HOUR: 3,
  DAY_CUTOFF_MINUTE: 0,

  /**
   * The old ISO week is over from Monday at this local time (confirmed 2026-11-10:
   * "Mit Montag 00:01 Uhr ist die alte Woche um"). Independent of DAY_CUTOFF:
   * Monday 01:00 still belongs to Sunday as a day, but Sunday's week is closed.
   */
  WEEK_CUTOFF_HOUR: 0,
  WEEK_CUTOFF_MINUTE: 0,

  /** Leaves granted for starting the habit — the first step of becoming active (2026-11-10). Never fall. */
  START_LEAVES: 1,

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
   * Items (4) and 7-point agreement scale confirmed only via secondary sources
   * (search 2026-11-10); original paper and German SRBAI-G not accessible from
   * the build environment. THRESHOLD is a set value, not a research cut-off.
   */
  SRBAI_ITEM_COUNT: 4,
  SRBAI_SCALE_MIN: 1,
  SRBAI_SCALE_MAX: 7,
  SRBAI_THRESHOLD: 5,

  /** Descriptive evaluation (Plan.md 2.8) from this many check-ins on. */
  INSIGHTS_MIN_CHECKINS: 14,

  /** Default reminder times for the calendar export (Plan.md 3, Phase 8), local time HH:MM. */
  ICS_DEFAULT_CHECKIN: '21:00',
  ICS_DEFAULT_MORNING: '07:30',

  /** Maximum length of user-entered texts (title, criterion, compensation, if-then plan). */
  TEXT_MAX_LENGTH: 120,

  /** Visible vitality per status level (healthy, slowed, stagnating, wilting). Only wilting lowers it (Plan.md 2.4). */
  VITALITY_BY_LEVEL: [1, 1, 1, 0.5] as const,
} as const;

export type Params = typeof PARAMS;
