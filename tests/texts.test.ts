import { describe, expect, it } from 'vitest';
import { TEXTS, pickLang } from '../src/ui/texts';

/** Flattens nested texts to "path -> value"; functions are called with sample arguments. */
function flatten(obj: object, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix + k;
    if (typeof v === 'function') out[key] = String((v as (...a: unknown[]) => unknown)(2, 'x'));
    else if (typeof v === 'object' && v !== null) Object.assign(out, flatten(v as object, key + '.'));
    else out[key] = String(v);
  }
  return out;
}

describe('UI language (D-06)', () => {
  it('German is the default, English only if preferred before German', () => {
    expect(pickLang([])).toBe('de');
    expect(pickLang(['fr-FR', 'it'])).toBe('de');
    expect(pickLang(['en-US', 'de-DE'])).toBe('en');
    expect(pickLang(['fr', 'de-AT', 'en'])).toBe('de');
    expect(pickLang(['EN-gb'])).toBe('en');
  });

  it('every text exists in both languages', () => {
    const de = flatten(TEXTS.de);
    const en = flatten(TEXTS.en);
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
    // Empty only where intended (no free criterion for quantity habits).
    const empty = (t: Record<string, string>) => Object.keys(t).filter((k) => t[k]?.trim() === '');
    expect(empty(de)).toEqual(['fieldCriterionPlaceholder.quantity']);
    expect(empty(en)).toEqual(['fieldCriterionPlaceholder.quantity']);
  });

  it('texts contain no numbers that belong in params.ts', () => {
    expect(TEXTS.de.errors.tooLong).toContain('{max}');
    expect(TEXTS.en.errors.tooLong).toContain('{max}');
  });
});
