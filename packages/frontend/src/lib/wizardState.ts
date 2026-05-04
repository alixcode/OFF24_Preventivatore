import type {
  WorkCategory,
  DetailLevel,
  Urgency,
  Material,
  Complexity,
  Operation,
} from "@off24/shared";

export interface MaterialLine {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  isPriceExpired: boolean;
}

export interface OperationLine {
  id: string;
  name: string;
  hours: number;
  hourlyRate: number;
}

export interface ExternalCostLine {
  id: string;
  description: string;
  amount: number;
}

export interface WizardState {
  // Step 1 — Qualificazione
  clientId: string;
  clientName: string;
  isNewClient: boolean;
  workCategory: WorkCategory | "";
  detailLevel: DetailLevel | "";
  urgency: Urgency | "";
  initialNotes: string;

  // Step 2 — Configuratore
  material: Material | "";
  complexity: Complexity | "";
  widthMm: number | null;
  heightMm: number | null;
  depthMm: number | null;
  weightKg: number | null;
  selectedOperations: Operation[];
  finishColor: string;
  finishType: string;
  includesPosa: boolean;

  // Step 3 — Materiali
  materialLines: MaterialLine[];
  operationLines: OperationLine[];
  externalCosts: ExternalCostLine[];

  // Step 4 — Prezzi
  appliedPrice: number;
  customMargin: number | null;

  // Step 5 — Revisione
  validityDays: number;
  paymentTerms: string;
  clientDescription: string;
  exclusions: string[];
}

export const INITIAL_STATE: WizardState = {
  clientId: "",
  clientName: "",
  isNewClient: true,
  workCategory: "",
  detailLevel: "",
  urgency: "",
  initialNotes: "",
  material: "",
  complexity: "",
  widthMm: null,
  heightMm: null,
  depthMm: null,
  weightKg: null,
  selectedOperations: [],
  finishColor: "",
  finishType: "opaco",
  includesPosa: false,
  materialLines: [],
  operationLines: [],
  externalCosts: [],
  appliedPrice: 0,
  customMargin: null,
  validityDays: 30,
  paymentTerms: "50% anticipato, 50% alla consegna",
  clientDescription: "",
  exclusions: ["Opere murarie", "Allacciamenti elettrici", "Permessi edilizi", "Posa in opera", "Varianti in corso d'opera"],
};

// Calcola il peso stimato da dimensioni e materiale
export function estimateWeight(
  widthMm: number | null,
  heightMm: number | null,
  depthMm: number | null,
  material: Material | ""
): number | null {
  if (!widthMm || !heightMm) return null;
  // Densità approssimativa kg/m³ per sezione tubolare standard
  const density = material === "alluminio" ? 2700 : material === "inox_304" ? 7900 : 7850;
  const thickness = (depthMm ?? 40) / 1000;
  const volume = (widthMm / 1000) * (heightMm / 1000) * thickness * 0.15; // 15% fill factor struttura
  return Math.round(volume * density);
}
