"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import {
  calculateRisk, calculateCosts, calculatePrices,
  MARGIN_MINIMUM, MARGIN_TARGET, OVERHEAD_DEFAULT,
} from "@off24/shared";
import type { WizardState } from "@/lib/wizardState";
import { StepNav } from "./Step1Qualificazione";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step4Prezzi({ state, onChange, onNext, onBack }: Props) {
  const [marginPct, setMarginPct] = useState(
    state.customMargin != null ? Math.round(state.customMargin * 100) : Math.round(MARGIN_TARGET * 100)
  );

  const risk = useMemo(() => calculateRisk({
    missingDrawings: state.detailLevel !== "disegno_tecnico",
    inputLevelPhoto: state.detailLevel === "foto_schizzo",
    inputLevelVerbal: state.detailLevel === "verbale",
    urgencyHigh: state.urgency === "urgente",
    urgencyVeryHigh: state.urgency === "urgentissimo",
    isNewClient: state.isNewClient,
    includesPosa: state.includesPosa,
    estimatedDimensions: [state.widthMm, state.heightMm, state.depthMm].filter(Boolean).length,
  }), [state]);

  const costs = useMemo(() => calculateCosts({
    materials: state.materialLines.map((m) => ({
      materialId: m.id, name: m.name, unit: m.unit,
      quantity: m.quantity, unitPrice: m.unitPrice,
      total: m.quantity * m.unitPrice, isPriceExpired: m.isPriceExpired,
    })),
    operations: state.operationLines.map((op) => ({
      operationId: op.id, name: op.name, hours: op.hours,
      hourlyRate: op.hourlyRate, total: op.hours * op.hourlyRate,
    })),
    externalCosts: state.externalCosts,
    overheadRate: OVERHEAD_DEFAULT,
    marginMinimum: MARGIN_MINIMUM,
    marginTarget: MARGIN_TARGET,
    riskCoefficient: risk.coefficient,
  }), [state, risk]);

  const prices = useMemo(
    () => calculatePrices(costs.costTotal, risk.coefficient, MARGIN_MINIMUM, MARGIN_TARGET),
    [costs, risk]
  );

  // Prezzo da slider margine personalizzato
  const customPrice = costs.costTotal > 0
    ? costs.costTotal / (1 - marginPct / 100)
    : 0;

  function applyPrice(price: number) {
    const margin = costs.costTotal > 0 ? (price - costs.costTotal) / price : 0;
    onChange({ appliedPrice: price, customMargin: margin });
  }

  const appliedPrice = state.appliedPrice > 0 ? state.appliedPrice : prices.priceRecommended;
  const appliedMarginPct = costs.costTotal > 0
    ? Math.round(((appliedPrice - costs.costTotal) / appliedPrice) * 100)
    : 0;

  const riskPct = Math.round(risk.coefficient * 100);
  const RISK_FACTORS: { label: string; active: boolean; value: string }[] = [
    { label: "Mancanza disegno tecnico", active: state.detailLevel !== "disegno_tecnico", value: "+15%" },
    { label: "Input foto/schizzo",       active: state.detailLevel === "foto_schizzo",    value: "+10%" },
    { label: "Input solo verbale",        active: state.detailLevel === "verbale",         value: "+5%" },
    { label: "Urgenza alta",              active: state.urgency === "urgente",             value: "+10%" },
    { label: "Urgenza altissima",         active: state.urgency === "urgentissimo",        value: "+5%" },
    { label: "Cliente nuovo",             active: state.isNewClient,                      value: "+5%" },
    { label: "Posa in opera",             active: state.includesPosa,                     value: "+10%" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl mb-1.5">
          Prezzi e <span className="text-accent">margini</span>
        </h2>
        <p className="text-brand-muted text-sm">
          Il motore ha calcolato costi e rischio. Scegli il prezzo da applicare al cliente.
        </p>
      </div>

      {/* ── RIEPILOGO COSTI ── */}
      <div>
        <SectionLabel>Riepilogo costi</SectionLabel>
        <div className="card p-5 space-y-1">
          <CostRow label="Materiali (incl. ferramenta)" value={costs.subtotalMaterials} />
          <CostRow label={`Manodopera (${state.operationLines.reduce((s, op) => s + op.hours, 0).toFixed(1)} ore)`} value={costs.subtotalOperations} />
          {costs.subtotalExternal > 0 && <CostRow label="Costi esterni" value={costs.subtotalExternal} />}
          <CostRow label={`Overhead ${Math.round(OVERHEAD_DEFAULT * 100)}%`} value={costs.overhead} muted />
          <div className="border-t border-brand-border pt-3 mt-3 flex justify-between items-baseline">
            <span className="text-sm font-semibold">Costo pieno</span>
            <span className="font-serif text-2xl text-accent">{fmt(costs.costTotal)}</span>
          </div>
        </div>
      </div>

      {/* ── MOTORE RISCHIO ── */}
      <div>
        <SectionLabel>Coefficiente rischio</SectionLabel>
        <div className="card p-5">
          <div className="space-y-2 mb-4">
            {RISK_FACTORS.filter((f) => f.active).map((f) => (
              <div key={f.label} className="flex justify-between text-[12.5px]">
                <span className="text-brand-muted">{f.label}</span>
                <span className="text-accent font-semibold">{f.value}</span>
              </div>
            ))}
            {RISK_FACTORS.every((f) => !f.active) && (
              <div className="text-brand-muted text-sm">Nessun fattore di rischio attivo</div>
            )}
          </div>
          <div className="flex justify-between items-baseline border-t border-brand-border pt-4">
            <div className="text-xs text-brand-muted uppercase tracking-wider">Rischio totale</div>
            <div className={clsx("font-serif text-3xl",
              riskPct >= 35 ? "text-status-red" : riskPct >= 20 ? "text-accent" : "text-status-green")}>
              {riskPct}%
            </div>
          </div>
        </div>
      </div>

      {/* ── PREZZI SUGGERITI ── */}
      <div>
        <SectionLabel>Prezzi calcolati</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <PriceCard
            label="Minimo sostenibile"
            value={prices.priceMinimum}
            margin={MARGIN_MINIMUM}
            note="Margine limite assoluto"
            noteColor="text-status-red"
            onClick={() => applyPrice(prices.priceMinimum)}
            selected={Math.abs(appliedPrice - prices.priceMinimum) < 1}
          />
          <PriceCard
            label="Prezzo tecnico"
            value={prices.priceTechnical}
            margin={MARGIN_TARGET}
            note="Margine target aziendale"
            onClick={() => applyPrice(prices.priceTechnical)}
            selected={Math.abs(appliedPrice - prices.priceTechnical) < 1}
          />
          <PriceCard
            label="Consigliato ★"
            value={prices.priceRecommended}
            margin={prices.appliedMargin}
            note={`Include rischio ${riskPct}%`}
            noteColor="text-accent"
            highlight
            onClick={() => applyPrice(prices.priceRecommended)}
            selected={Math.abs(appliedPrice - prices.priceRecommended) < 1}
          />
          <PriceCard
            label="Prezzo valore"
            value={prices.priceRecommended * 1.15}
            margin={(prices.priceRecommended * 1.15 - costs.costTotal) / (prices.priceRecommended * 1.15)}
            note="Percezione mercato alta"
            noteColor="text-status-green"
            onClick={() => applyPrice(prices.priceRecommended * 1.15)}
            selected={false}
          />
        </div>
      </div>

      {/* ── SLIDER MARGINE ── */}
      <div>
        <SectionLabel>Margine personalizzato</SectionLabel>
        <div className="card p-5">
          <div className="flex justify-between text-[12px] text-brand-muted mb-3">
            <span>Minimo {Math.round(MARGIN_MINIMUM * 100)}%</span>
            <span className="font-serif text-xl text-brand-text">{marginPct}%</span>
            <span>Target {Math.round(MARGIN_TARGET * 100)}%</span>
          </div>
          <input
            type="range" min={Math.round(MARGIN_MINIMUM * 100)} max={60} value={marginPct}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              setMarginPct(v);
              applyPrice(costs.costTotal / (1 - v / 100));
            }}
            className="w-full accent-accent"
          />
          <div className="flex justify-between mt-3 items-center">
            <span className="text-[12px] text-brand-muted">Prezzo risultante</span>
            <span className="font-serif text-xl">{fmt(customPrice)}</span>
          </div>
        </div>
      </div>

      {/* ── PREZZO APPLICATO ── */}
      <div className="card p-5 border-accent/40 bg-accent/5">
        <div className="text-[11px] text-accent font-bold uppercase tracking-wider mb-3">Prezzo selezionato</div>
        <div className="flex justify-between items-center">
          <div>
            <div className="font-serif text-3xl">{fmt(appliedPrice)}</div>
            <div className="text-[12px] text-brand-muted mt-1">
              Margine: <span className={clsx("font-bold", appliedMarginPct >= 30 ? "text-status-green" : appliedMarginPct >= 20 ? "text-accent" : "text-status-red")}>
                {appliedMarginPct}%
              </span>
              {appliedMarginPct < Math.round(MARGIN_MINIMUM * 100) && (
                <span className="ml-2 text-status-red">⚠ Sotto soglia minima — richiede approvazione</span>
              )}
            </div>
          </div>
          <input
            type="number"
            className="input w-40 text-right font-semibold"
            value={Math.round(appliedPrice)}
            onChange={(e) => applyPrice(parseFloat(e.target.value) || 0)}
            placeholder="Modifica manuale"
          />
        </div>
      </div>

      <StepNav onBack={onBack} onNext={onNext} canProceed={costs.costTotal > 0 && appliedPrice > 0} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-brand-muted tracking-[1.5px] font-bold uppercase mb-3">{children}</div>;
}

function CostRow({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="flex justify-between text-[13px] py-1">
      <span className={muted ? "text-brand-muted" : "text-brand-subtle"}>{label}</span>
      <span className={muted ? "text-brand-muted" : "font-medium"}>{fmt(value)}</span>
    </div>
  );
}

function PriceCard({ label, value, margin, note, noteColor, highlight, onClick, selected }: {
  label: string; value: number; margin: number; note: string;
  noteColor?: string; highlight?: boolean; onClick: () => void; selected: boolean;
}) {
  return (
    <button
      type="button" onClick={onClick}
      className={clsx(
        "border p-4 text-left transition-colors w-full",
        selected
          ? "border-accent bg-accent/10"
          : highlight
          ? "border-accent/40 bg-accent/5 hover:border-accent"
          : "border-brand-border hover:border-accent/40"
      )}
    >
      <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1.5">{label}</div>
      <div className="font-serif text-2xl mb-1">{fmt(value)}</div>
      <div className="text-[12px] text-status-green">Margine {Math.round(margin * 100)}%</div>
      <div className={clsx("text-[11px] mt-0.5", noteColor ?? "text-brand-muted")}>{note}</div>
    </button>
  );
}

function fmt(n: number) {
  return "€ " + Math.round(n).toLocaleString("it-IT");
}
