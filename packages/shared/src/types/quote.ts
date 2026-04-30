export type QuoteStatus =
  | "bozza"
  | "inviato"
  | "approvato"
  | "perso"
  | "scaduto";

export type DetailLevel = "verbale" | "foto_schizzo" | "disegno_tecnico";

export type Urgency = "normale" | "urgente" | "urgentissimo";

export type WorkCategory =
  | "scale"
  | "cancelli"
  | "strutture"
  | "pensiline"
  | "ringhiere"
  | "altro";

export type Material = "ferro_s235" | "inox_304" | "alluminio";

export type Complexity = "bassa" | "media" | "alta";

export type Operation =
  | "taglio_plasma"
  | "saldatura_mig"
  | "saldatura_tig"
  | "piega_cnc"
  | "foratura"
  | "molatura"
  | "verniciatura"
  | "zincatura"
  | "sabbiatura"
  | "posa_in_opera";

export interface QuoteSummary {
  id: string;
  number: string;
  clientName: string;
  description: string;
  status: QuoteStatus;
  totalPrice: number;
  margin: number;
  riskCoefficient: number;
  reliabilityIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteVersion {
  id: string;
  quoteId: string;
  version: number;
  totalPrice: number;
  costTotal: number;
  margin: number;
  notes: string | null;
  createdAt: string;
}

// Risposta API per la lista preventivi
export interface ApiQuoteListResponse {
  data: QuoteSummary[];
  total: number;
  page: number;
  pageSize: number;
}
