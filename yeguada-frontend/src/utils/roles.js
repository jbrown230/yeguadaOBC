// utils/roles.js — roles del panel (deben coincidir con ROLES en yeguada-backend/auth/config.js)
export const ROLES = {
  admin:    { label: 'Administrador', desc: 'Acceso total: configuración, intenciones, WhatsApp y usuarios.' },
  operador: { label: 'Operador',      desc: 'Ve el panel, monitoreo y atiende escalamientos. Solo lectura.' },
};
export const roleLabel = (role) => ROLES[role]?.label || role;
