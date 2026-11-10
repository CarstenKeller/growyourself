/**
 * All UI texts, German and English (design decision D-06: German is the
 * default; English only when the browser prefers English). No own language
 * switch, like on Android where the system setting decides (D-06).
 */
export type Lang = 'de' | 'en';

const de = {
  appName: 'Gewohnheitsbaum',
  shellNote: 'Hier wächst bald dein Baum. Alle Daten bleiben auf diesem Gerät.',
};

const en: typeof de = {
  appName: 'Habit Tree',
  shellNote: 'Your tree will grow here soon. All data stays on this device.',
};

export type Texts = typeof de;
export const TEXTS: Record<Lang, Texts> = { de, en };

/** First supported language in the browser's preference list; German otherwise. */
export function pickLang(preferred: readonly string[]): Lang {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    if (base === 'de') return 'de';
    if (base === 'en') return 'en';
  }
  return 'de';
}
