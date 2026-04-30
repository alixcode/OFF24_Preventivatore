import {
  CostBreakdown,
  PriceEngine,
  MaterialItem,
  OperationItem,
  HARDWARE_PERCENT,
  CONSUMABLES_PER_HOUR,
} from "@off24/shared";

interface CostInput {
  materials: MaterialItem[];
  operations: OperationItem[];
  externalCosts: { description: string; amount: number }[];
  overheadRate: number;
  marginMinimum: number;
  marginTarget: number;
  riskCoefficient: number;
}

export function calculateCosts(input: CostInput): CostBreakdown {
  const subtotalMaterials = input.materials.reduce((sum, m) => sum + m.total, 0);
  const hardware = subtotalMaterials * HARDWARE_PERCENT;

  const totalHours = input.operations.reduce((sum, op) => sum + op.hours, 0);
  const subtotalOperations = input.operations.reduce((sum, op) => sum + op.total, 0);
  const consumables = totalHours * CONSUMABLES_PER_HOUR;

  const subtotalExternal = input.externalCosts.reduce((sum, c) => sum + c.amount, 0);

  const baseBeforeOverhead = subtotalMaterials + hardware + subtotalOperations + consumables + subtotalExternal;
  const overhead = baseBeforeOverhead * input.overheadRate;
  const costTotal = baseBeforeOverhead + overhead;

  return {
    materials: input.materials,
    operations: input.operations,
    hardware,
    consumables,
    externalCosts: input.externalCosts,
    overhead,
    overheadRate: input.overheadRate,
    subtotalMaterials: subtotalMaterials + hardware,
    subtotalOperations: subtotalOperations + consumables,
    subtotalExternal,
    costTotal,
  };
}

export function calculatePrices(
  costTotal: number,
  riskCoefficient: number,
  marginMinimum: number,
  marginTarget: number
): PriceEngine {
  const priceMinimum = costTotal / (1 - marginMinimum);
  const priceTechnical = costTotal * (1 + marginTarget);
  const priceRecommended = priceTechnical * (1 + riskCoefficient);

  return {
    costTotal,
    riskCoefficient,
    marginMinimum,
    marginTarget,
    priceMinimum,
    priceTechnical,
    priceRecommended,
    priceValue: null,
    appliedPrice: priceRecommended,
    appliedMargin: (priceRecommended - costTotal) / priceRecommended,
  };
}
