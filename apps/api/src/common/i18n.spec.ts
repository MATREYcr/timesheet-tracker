import { parseAcceptLanguage, getMessage, DEFAULT_LOCALE } from './i18n.js';

describe('parseAcceptLanguage', () => {
  it('defaults to English when missing or unsupported', () => {
    expect(parseAcceptLanguage(undefined)).toBe('en');
    expect(parseAcceptLanguage('')).toBe('en');
    expect(parseAcceptLanguage('fr')).toBe(DEFAULT_LOCALE);
  });

  it('matches plain and regional tags', () => {
    expect(parseAcceptLanguage('es')).toBe('es');
    expect(parseAcceptLanguage('es-ES')).toBe('es');
    expect(parseAcceptLanguage('en-US')).toBe('en');
  });

  it('honours quality values in a weighted list', () => {
    expect(parseAcceptLanguage('es,en;q=0.8')).toBe('es');
    expect(parseAcceptLanguage('en;q=0.9,es;q=0.95')).toBe('es');
    expect(parseAcceptLanguage('fr,es;q=0.7,en;q=0.6')).toBe('es');
  });
});

describe('getMessage', () => {
  it('returns localized text per code', () => {
    expect(getMessage('WEEK_LOCKED', 'en')).toMatch(/locked/i);
    expect(getMessage('WEEK_LOCKED', 'es')).toMatch(/bloqueada/i);
    expect(getMessage('NOT_FOUND', 'es')).toMatch(/no encontrado/i);
  });
});
