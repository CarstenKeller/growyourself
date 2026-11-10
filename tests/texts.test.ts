import { describe, expect, it } from 'vitest';
import { TEXTS, pickLang } from '../src/ui/texts';

describe('UI language (D-06)', () => {
  it('German is the default, English only if preferred before German', () => {
    expect(pickLang([])).toBe('de');
    expect(pickLang(['fr-FR', 'it'])).toBe('de');
    expect(pickLang(['en-US', 'de-DE'])).toBe('en');
    expect(pickLang(['fr', 'de-AT', 'en'])).toBe('de');
    expect(pickLang(['EN-gb'])).toBe('en');
  });

  it('every text exists in both languages and is not empty', () => {
    expect(Object.keys(TEXTS.en).sort()).toEqual(Object.keys(TEXTS.de).sort());
    for (const lang of ['de', 'en'] as const) {
      for (const value of Object.values(TEXTS[lang])) expect(value.trim()).not.toBe('');
    }
  });
});
