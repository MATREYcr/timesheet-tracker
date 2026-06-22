// The set of locales the product supports, shared by the API (Accept-Language
// negotiation + error messages) and the web client (UI translations). Single
// source of truth: add a language here and both sides agree on what's valid.

export const LOCALES = ['en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
