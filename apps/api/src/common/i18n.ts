// Error message localization. The canonical en/es text for each ErrorCode lives
// here (the codes themselves are the shared contract). Locale is chosen from the
// Accept-Language header, defaulting to English.

import type { ErrorCode } from '@timesheet/shared';

export type Locale = 'en' | 'es';
export const DEFAULT_LOCALE: Locale = 'en';

const MESSAGES: Record<ErrorCode, Record<Locale, string>> = {
  VALIDATION_ERROR: {
    en: 'Invalid request data.',
    es: 'Datos de solicitud inválidos.',
  },
  NOT_FOUND: {
    en: 'Resource not found.',
    es: 'Recurso no encontrado.',
  },
  EMPLOYEE_INACTIVE: {
    en: 'Cannot log time for an inactive employee.',
    es: 'No se puede registrar tiempo para un empleado inactivo.',
  },
  FUTURE_DATE: {
    en: 'Date cannot be in the future.',
    es: 'La fecha no puede ser futura.',
  },
  WEEK_LOCKED: {
    en: 'This week is approved and locked.',
    es: 'Esta semana está aprobada y bloqueada.',
  },
  INTERNAL_ERROR: {
    en: 'Something went wrong.',
    es: 'Algo salió mal.',
  },
};

export function getMessage(code: ErrorCode, locale: Locale): string {
  return MESSAGES[code][locale];
}

/**
 * Pick a supported locale from an Accept-Language header. Handles plain tags
 * (`es`), regional tags (`es-ES`), and weighted lists (`es,en;q=0.8`), matching on
 * the primary subtag and honouring quality values. Defaults to English.
 */
export function parseAcceptLanguage(header: string | undefined | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.split('=')[1]) : 1;
      return {
        primary: tag.trim().toLowerCase().split('-')[0],
        q: Number.isNaN(q) ? 0 : q,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const { primary } of ranked) {
    if (primary === 'es') return 'es';
    if (primary === 'en') return 'en';
  }
  return DEFAULT_LOCALE;
}
