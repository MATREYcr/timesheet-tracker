// Ambient declaration for side-effect CSS imports (e.g. `import './global.css'`).
// Next/Turbopack bundles the CSS; TypeScript has no built-in module type for it,
// so without this the editor flags ts(2882). tsc itself already compiles fine.
declare module '*.css';

// Type-safe translation keys: `t('nav.employees')` is checked against en.json.
import type en from './i18n/locales/en.json';

declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof en;
  }
}
