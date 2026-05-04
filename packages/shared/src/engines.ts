import type { CostBreakdown, PriceEngine, MaterialItem, OperationItem, ExternalCost } from "./types/cost";
import { HARDWARE_PERCENT, CONSUMABLES_PER_HOUR } from "./constants";

interface CostInput {
  materials: MaterialItem[];
  operations: OperationItem[];
  externalCosts: ExternalCost[];
  overheadRate: number;
  marginMinimum: number;
  marginTarget: number;
  riskCoefficient: number;
}

export function calculateCosts(input: CostInput): CostBreakdown {
  const rawMaterials = input.materials.reduce((s, m) => s + m.total, 0);
  const hardware     = rawMaterials * HARDWARE_PERCENT;

  const totalHours         = input.operations.reduce((s, op) => s + op.hours, 0);
  const subtotalOperations = input.operations.reduce((s, op) => s + op.total, 0);
  const consumables        = totalHours * CONSUMABLES_PER_HOUR;

  const subtotalExternal = input.externalCosts.reduce((s, c) => s + c.amount, 0);

  const base     = rawMaterials + hardware + subtotalOperations + consumables + subtotalExternal;
  const overhead = base * input.overheadRate;
  const costTotal = base + overhead;

  return {
    materials:          input.materials,
    operations:         input.operations,
    hardware,
    consumables,
    externalCosts:      input.externalCosts,
    overhead,
    overheadRate:       input.overheadRate,
    subtotalMaterials:  rawMaterials + hardware,
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
  const priceMinimum    = costTotal / (1 - marginMinimum);
  const priceTechnical  = costTotal * (1 + marginTarget);
  const priceRecommended = priceTechnical * (1 + riskCoefficient);

  return {
    costTotal,
    riskCoefficient,
    marginMinimum,
    marginTarget,
    priceMinimum,
    priceTechnical,
    priceRecommended,
    priceValue:    null,
    appliedPrice:  priceRecommended,
    appliedMargin: (priceRecommended - costTotal) / priceRecommended,
  };
}
