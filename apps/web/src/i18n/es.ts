import type { Dictionary } from './en';

// Same shape as `en` (enforced by the Dictionary type).
export const es: Dictionary = {
  app: {
    title: 'Mini Timesheets',
    subtitle: 'Gestiona empleados por hora, registra tiempo y aprueba semanas.',
  },
  nav: {
    employees: 'Empleados',
    timeEntries: 'Registros de tiempo',
    weeklySummary: 'Resumen semanal',
  },
  common: {
    add: 'Agregar',
    edit: 'Editar',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    loading: 'Cargando…',
    empty: 'Aún no hay nada.',
    retry: 'Reintentar',
    error: 'Algo salió mal.',
  },
};
