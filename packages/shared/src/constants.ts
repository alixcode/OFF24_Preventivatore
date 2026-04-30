export const MARGIN_MINIMUM = 0.20;
export const MARGIN_TARGET = 0.30;
export const OVERHEAD_DEFAULT = 0.18;
export const HARDWARE_PERCENT = 0.05;      // ferramenta su materiali
export const CONSUMABLES_PER_HOUR = 2.00;  // €/ora lavorazione
export const PRICE_VALIDITY_DAYS = 30;     // giorni validità prezzi materiali
export const QUOTE_VALIDITY_DAYS = 30;     // giorni validità offerta default

export const OPERATION_LABELS: Record<string, string> = {
  taglio_plasma: "Taglio plasma",
  saldatura_mig: "Saldatura MIG",
  saldatura_tig: "Saldatura TIG",
  piega_cnc: "Piega CNC",
  foratura: "Foratura",
  molatura: "Molatura e finitura",
  verniciatura: "Verniciatura",
  zincatura: "Zincatura (esterno)",
  sabbiatura: "Sabbiatura",
  posa_in_opera: "Posa in opera",
};

export const STANDARD_EXCLUSIONS = [
  "Opere murarie",
  "Allacciamenti elettrici",
  "Permessi edilizi",
  "Posa in opera",
  "Varianti in corso d'opera",
];
