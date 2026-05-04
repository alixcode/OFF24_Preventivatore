import { calculateRisk, calculateCosts, calculatePrices, MARGIN_MINIMUM, MARGIN_TARGET, OVERHEAD_DEFAULT, HARDWARE_PERCENT, CONSUMABLES_PER_HOUR } from "@off24/shared";
import type { WizardState } from "@/lib/wizardState";

interface Props {
  state: WizardState;
}

export function WizardSidebar({ state }: Props) {
  // Calcolo rischio live
  const risk = calculateRisk({
    missingDrawings: state.detailLevel !== "disegno_tecnico",
    inputLevelPhoto: state.detailLevel === "foto_schizzo",
    inputLevelVerbal: state.detailLevel === "verbale",
    urgencyHigh: state.urgency === "urgente",
    urgencyVeryHigh: state.urgency === "urgentissimo",
    isNewClient: state.isNewClient,
    includesPosa: state.includesPosa,
    estimatedDimensions: [state.widthMm, state.heightMm, state.depthMm].filter(Boolean).length,
  });

  // Calcolo costi live
  const costs = calculateCosts({
    materials: state.materialLines.map((m) => ({
      materialId: m.id,
      name: m.name,
      unit: m.unit,
      quantity: m.quantity,
      unitPrice: m.unitPrice,
      total: m.quantity * m.unitPrice,
      isPriceExpired: m.isPriceExpired,
    })),
    operations: state.operationLines.map((op) => ({
      operationId: op.id,
      name: op.name,
      hours: op.hours,
      hourlyRate: op.hourlyRate,
      total: op.hours * op.hourlyRate,
    })),
    externalCosts: state.externalCosts,
    overheadRate: OVERHEAD_DEFAULT,
    marginMinimum: MARGIN_MINIMUM,
    marginTarget: MARGIN_TARGET,
    riskCoefficient: risk.coefficient,
  });

  const prices = calculatePrices(costs.costTotal, risk.coefficient, MARGIN_MINIMUM, MARGIN_TARGET);

  const riskPct = Math.round(risk.coefficient * 100);
  const riskColor = riskPct >= 35 ? "text-status-red" : riskPct >= 20 ? "text-accent" : "text-status-green";

  return (
    <aside className="w-[300px] bg-bg-secondary border-l border-brand-border p-6 flex flex-col gap-5 overflow-y-auto">
      <div className="text-[11px] text-brand-muted tracking-[1.5px] font-bold uppercase">
        Riepilogo live
      </div>

      {/* Info base */}
      <div className="space-y-1.5">
        {state.clientName && (
          <Row label="Cliente" value={state.clientName} />
        )}
        {state.workCategory && (
          <Row label="Tipo" value={CATEGORY_LABELS[state.workCategory] ?? state.workCategory} />
        )}
        {state.material && (
          <Row label="Materiale" value={MATERIAL_LABELS[state.material] ?? state.material} />
        )}
        {state.widthMm && state.heightMm && (
          <Row label="Dimensioni" value={`${state.widthMm}×${state.heightMm} mm`} />
        )}
        {state.weightKg && (
          <Row label="Peso stimato" value={`${state.weightKg} kg`} />
        )}
      </div>

      <Divider />

      {/* Costi */}
      {costs.costTotal > 0 ? (
        <div className="space-y-1.5">
          <Row label="Materiali" value={fmt(costs.subtotalMaterials)} />
          <Row label="Manodopera" value={fmt(costs.subtotalOperations)} />
          {costs.subtotalExternal > 0 && (
            <Row label="Costi esterni" value={fmt(costs.subtotalExternal)} />
          )}
          <Row label={`Overhead ${Math.round(OVERHEAD_DEFAULT * 100)}%`} value={fmt(costs.overhead)} muted />
        </div>
      ) : (
        <div className="text-[12px] text-brand-muted italic">
          Aggiungi materiali e lavorazioni per vedere i costi
        </div>
      )}

      {costs.costTotal > 0 && (
        <>
          <div className="flex justify-between items-baseline border-t border-brand-border pt-3">
            <span className="text-xs text-brand-muted">Costo pieno</span>
            <span className="font-serif text-xl text-accent">{fmt(costs.costTotal)}</span>
          </div>

          <Divider />

          {/* Rischio */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] text-brand-muted uppercase tracking-wider font-bold">Rischio</span>
              <span className={`font-serif text-2xl ${riskColor}`}>{riskPct}%</span>
            </div>
            <div className="h-1 bg-brand-border">
              <div
                className={`h-full transition-all ${riskPct >= 35 ? "bg-status-red" : riskPct >= 20 ? "bg-accent" : "bg-status-green"}`}
                style={{ width: `${Math.min(riskPct * 2, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-brand-muted">
              <span>Affidabilità: {risk.reliabilityIndex}/100</span>
              <span className="capitalize">{RISK_STATUS_LABEL[risk.status]}</span>
            </div>
          </div>

          <Divider />

          {/* Prezzi */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-brand-muted uppercase tracking-wider font-bold mb-2">Prezzi</div>
            <Row label="Minimo" value={fmt(prices.priceMinimum)} valueClass="text-status-red" />
            <Row label="Tecnico" value={fmt(prices.priceTechnical)} />
            <Row label="Consigliato ★" value={fmt(prices.priceRecommended)} valueClass="text-accent font-bold" />
          </div>

          {/* Suggerimento se rischio alto */}
          {risk.suggestions.length > 0 && (
            <>
              <Divider />
              <div className="text-[11px] text-brand-muted leading-relaxed space-y-1">
                {risk.suggestions.slice(0, 2).map((s, i) => (
                  <div key={i} className="flex gap-1.5">
                    <span className="text-accent flex-shrink-0">▸</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </aside>
  );
}

function Row({ label, value, muted, valueClass }: { label: string; value: string; muted?: boolean; valueClass?: string }) {
  return (
    <div className="flex justify-between text-[12.5px]">
      <span className={muted ? "text-brand-muted" : "text-brand-subtle"}>{label}</span>
      <span className={valueClass ?? "font-medium"}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-brand-border" />;
}

function fmt(n: number) {
  return "€ " + Math.round(n).toLocaleString("it-IT");
}

const CATEGORY_LABELS: Record<string, string> = {
  scale: "Scale", cancelli: "Cancelli", strutture: "Strutture",
  pensiline: "Pensiline", ringhiere: "Ringhiere", altro: "Altro",
};

const MATERIAL_LABELS: Record<string, string> = {
  ferro_s235: "Ferro / Acciaio S235",
  inox_304: "Acciaio inox 304",
  alluminio: "Alluminio",
};

const RISK_STATUS_LABEL: Record<string, string> = {
  preventivabile: "Preventivabile",
  stimabile: "Stima preliminare",
  non_preventivabile: "Non preventivabile",
};
