/**
 * All UI texts, German and English (design decision D-06: German is the
 * default; English only when the browser prefers English). No own language
 * switch, like on Android where the system setting decides (D-06).
 * No promises of medical or psychological effect (CLAUDE.md).
 */
export type Lang = 'de' | 'en';

const de = {
  appName: 'Gewohnheitsbaum',
  loading: 'Wird geladen …',
  storageError: 'Die Daten auf diesem Gerät konnten nicht geöffnet werden. Im privaten Modus speichern manche Browser nichts.',

  // Onboarding (Phase 3)
  obTitle: 'Eine Gewohnheit pflanzen',
  obIntro: 'Du begleitest immer genau eine Gewohnheit – so lange, bis sie sich selbstverständlich anfühlt.',
  obTypeLegend: 'Was möchtest du?',
  typeQuantity: 'Mehr von etwas',
  typeQuantityHint: 'Eine Menge erreichen, z. B. 8.000 Schritte',
  typeRitual: 'Ein tägliches Ritual',
  typeRitualHint: 'Etwas jeden Tag tun, z. B. 5 Minuten den nächsten Tag planen',
  typeAbstinence: 'Etwas lassen',
  typeAbstinenceHint: 'Etwas nicht mehr tun, z. B. kein Handy nach 21 Uhr',
  fieldTitle: 'Kurzer Name',
  fieldTitlePlaceholder: { quantity: 'z. B. Mehr gehen', ritual: 'z. B. Tagesplanung', abstinence: 'z. B. Handyfreier Abend' },
  fieldCriterion: 'Ein Tag ist geschafft, wenn …',
  fieldCriterionPlaceholder: {
    quantity: '',
    ritual: 'z. B. ich 5 Minuten den morgigen Tag geplant habe',
    abstinence: 'z. B. ich nach 21 Uhr nicht durch Social Media gescrollt habe',
  },
  fieldTarget: 'Ein Tag ist geschafft ab',
  fieldTargetPlaceholder: 'z. B. 8.000',
  fieldUnit: 'Einheit',
  fieldUnitPlaceholder: 'z. B. Schritte',
  fieldCompensation: 'Ausgleich für einen verpassten Tag',
  fieldCompensationHint: 'Eine kleine Handlung, die dein Ziel stärkt. Erledigst du sie bis Sonntag, wird der verpasste Tag doch noch zum Blatt.',
  fieldCompensationPlaceholder: {
    quantity: 'z. B. 1 km extra gehen',
    ritual: 'z. B. 15 Minuten lesen',
    abstinence: 'z. B. 20 Minuten spazieren statt scrollen',
  },
  intentionLegend: 'Dein erster Plan (optional)',
  intentionHint: 'Ein Wenn-dann-Satz macht es leichter, im richtigen Moment daran zu denken.',
  fieldIf: 'Wenn …',
  fieldIfPlaceholder: 'z. B. ich abends den Laptop zuklappe',
  fieldThen: 'dann …',
  fieldThenPlaceholder: 'z. B. plane ich 5 Minuten den nächsten Tag',
  helpHintTitle: 'Gut zu wissen',
  helpHint:
    'Wenn es um Rauchen, Alkohol oder andere Suchtmittel geht: Professionelle Unterstützung kann viel ausmachen – zum Beispiel über die Hausarztpraxis oder eine Suchtberatungsstelle. Diese App ersetzt keine Beratung und keine Behandlung.',
  privacyNote: 'Alles bleibt auf diesem Gerät. Es gibt kein Konto und keine Cloud.',
  submit: 'Baum pflanzen',
  errors: {
    titleMissing: 'Bitte gib der Gewohnheit einen Namen.',
    criterionMissing: 'Bitte beschreibe, wann ein Tag geschafft ist.',
    targetInvalid: 'Bitte gib eine Zahl größer als 0 ein.',
    unitMissing: 'Bitte gib eine Einheit an.',
    compensationMissing: 'Bitte lege einen Ausgleich fest.',
    intentionIncomplete: 'Bitte fülle beide Teile aus – oder lass beide leer.',
    tooLong: 'Bitte fasse dich etwas kürzer (höchstens {max} Zeichen je Feld).',
  },
  errorSummary: 'Bitte prüfe die markierten Felder.',
  alreadyActive: 'Es gibt schon eine aktive Gewohnheit. Eine neue wird erst frei, wenn diese abgeschlossen oder bewusst beendet ist.',

  // Home (placeholder until Phase 4/5)
  homeLeaves: (n: number) => (n === 1 ? '1 Blatt' : `${n} Blätter`),
  homePlanted: 'Dein Baum ist gepflanzt. Das erste Blatt gehört dir – für den ersten Schritt.',
  homeCriterion: 'Ein Tag ist geschafft, wenn',
  homeQuantityCriterion: (target: string, unit: string) => `mindestens ${target} ${unit}`,
  homeCompensation: 'Ausgleich',
  homeIntention: 'Dein Plan',
  homeIntentionText: (ifPart: string, thenPart: string) => `Wenn ${ifPart}, dann ${thenPart}.`,
  homeNext: 'Der tägliche Check-in kommt im nächsten Schritt der Entwicklung.',
};

export type Texts = typeof de;

const en: Texts = {
  appName: 'Habit Tree',
  loading: 'Loading …',
  storageError: 'The data on this device could not be opened. Some browsers do not store anything in private mode.',

  obTitle: 'Plant a habit',
  obIntro: 'You always work on exactly one habit – until it feels natural.',
  obTypeLegend: 'What would you like to do?',
  typeQuantity: 'More of something',
  typeQuantityHint: 'Reach an amount, e.g. 8,000 steps',
  typeRitual: 'A daily ritual',
  typeRitualHint: 'Do something every day, e.g. plan the next day for 5 minutes',
  typeAbstinence: 'Stop doing something',
  typeAbstinenceHint: 'Leave something out, e.g. no phone after 9 pm',
  fieldTitle: 'Short name',
  fieldTitlePlaceholder: { quantity: 'e.g. Walk more', ritual: 'e.g. Daily planning', abstinence: 'e.g. Phone-free evening' },
  fieldCriterion: 'A day counts when …',
  fieldCriterionPlaceholder: {
    quantity: '',
    ritual: 'e.g. I spent 5 minutes planning tomorrow',
    abstinence: 'e.g. I did not scroll social media after 9 pm',
  },
  fieldTarget: 'A day counts from',
  fieldTargetPlaceholder: 'e.g. 8000',
  fieldUnit: 'Unit',
  fieldUnitPlaceholder: 'e.g. steps',
  fieldCompensation: 'Make-up for a missed day',
  fieldCompensationHint: 'A small action that supports your goal. Do it by Sunday and the missed day still becomes a leaf.',
  fieldCompensationPlaceholder: {
    quantity: 'e.g. walk 1 km extra',
    ritual: 'e.g. read for 15 minutes',
    abstinence: 'e.g. take a 20-minute walk instead of scrolling',
  },
  intentionLegend: 'Your first plan (optional)',
  intentionHint: 'An if-then sentence makes it easier to remember at the right moment.',
  fieldIf: 'If …',
  fieldIfPlaceholder: 'e.g. I close my laptop in the evening',
  fieldThen: 'then …',
  fieldThenPlaceholder: 'e.g. I plan the next day for 5 minutes',
  helpHintTitle: 'Good to know',
  helpHint:
    'If this is about smoking, alcohol or other addictive substances: professional support can make a real difference – for example through your doctor or an addiction counselling service. This app does not replace counselling or treatment.',
  privacyNote: 'Everything stays on this device. There is no account and no cloud.',
  submit: 'Plant tree',
  errors: {
    titleMissing: 'Please give the habit a name.',
    criterionMissing: 'Please describe when a day counts.',
    targetInvalid: 'Please enter a number greater than 0.',
    unitMissing: 'Please enter a unit.',
    compensationMissing: 'Please choose a make-up action.',
    intentionIncomplete: 'Please fill in both parts – or leave both empty.',
    tooLong: 'Please keep it shorter (at most {max} characters per field).',
  },
  errorSummary: 'Please check the marked fields.',
  alreadyActive: 'There is already an active habit. A new one becomes available once this one is completed or deliberately ended.',

  homeLeaves: (n: number) => (n === 1 ? '1 leaf' : `${n} leaves`),
  homePlanted: 'Your tree is planted. The first leaf is yours – for taking the first step.',
  homeCriterion: 'A day counts when',
  homeQuantityCriterion: (target: string, unit: string) => `at least ${target} ${unit}`,
  homeCompensation: 'Make-up',
  homeIntention: 'Your plan',
  homeIntentionText: (ifPart: string, thenPart: string) => `If ${ifPart}, then ${thenPart}.`,
  homeNext: 'The daily check-in comes in the next development step.',
};

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
