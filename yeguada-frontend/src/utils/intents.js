// utils/intents.js — nombres legibles de las intenciones sembradas (Dashboard y Monitor)
export const INTENT_LABELS = {
  'booking.tour':        'Reserva de tours',
  'guide.availability':  'Disponibilidad de guía',
  'pricing.info':        'Precios',
  'general.info':        'Info general',
  'location.directions': 'Cómo llegar',
  'camping.info':        'Camping',
  'waterfall.info':      'Cascadas',
  'hours.info':          'Horarios',
  greeting:              'Saludos',
  farewell:              'Despedidas',
  'fuera.de.alcance':    'Fuera de alcance',
  unknown:               'Sin clasificar',
};
export const intentLabel = (id) => INTENT_LABELS[id] || id;
