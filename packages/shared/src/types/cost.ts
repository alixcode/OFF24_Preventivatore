export interface MaterialItem {
  materialId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isPriceExpired: boolean;
}

export interface OperationItem {
  operationId: string;
  name: string;
  hours: number;
  hourlyRate: number;
  total: number;
}

export interface ExternalCost {
  description: string;
  amount: number;
}

export interface CostBreakdown {
  materials: MaterialItem[];
  operations: OperationItem[];
  hardware: number;        // ferramenta (% su materiali)
  consumables: number;     // consumabili
  externalCosts: ExternalCost[];
  overhead: number;        // overhead calcolato
  overheadRate: number;    // coefficiente overhead (es. 0.18)
  subtotalMaterials: number;
  subtotalOperations: number;
  subtotalExternal: number;
  costTotal: number;
}

export interface PriceEngine {
  costTotal: number;
  riskCoefficient: number;    // 0–0.5
  marginMinimum: number;      // es. 0.20
  marginTarget: number;       // es. 0.30
  priceMinimum: number;       // costo / (1 - marginMinimum)
  priceTechnical: number;     // costo * (1 + marginTarget)
  priceRecommended: number;   // priceTechnical * (1 + riskCoefficient)
  priceValue: number | null;  // override manuale
  appliedPrice: number;
  appliedMargin: number;
}
