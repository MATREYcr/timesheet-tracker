// Transversal, platform-agnostic building blocks: date math + calendar
// validation, the payroll calculation, the error contract, pagination, and the
// supported-locale contract.
// `core` knows nothing about the business concepts in `domain`.

export * from './dates.js';
export * from './pay.js';
export * from './errors.js';
export * from './pagination.js';
export * from './locale.js';
