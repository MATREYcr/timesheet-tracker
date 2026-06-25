import { DEFAULT_LOCALE, LOCALES, type ErrorCode, type Locale } from '@timesheet/shared';

export { DEFAULT_LOCALE, type Locale };

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

// Parses Accept-Language header with regional tags (es-ES) and quality values (es,en;q=0.8).
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
    if (LOCALES.includes(primary as Locale)) return primary as Locale;
  }
  return DEFAULT_LOCALE;
}
