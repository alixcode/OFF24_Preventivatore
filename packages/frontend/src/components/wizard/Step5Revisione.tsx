"use client";

import { clsx } from "clsx";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { calculateRisk, calculateCosts, calculatePrices, MARGIN_MINIMUM, MARGIN_TARGET, OVERHEAD_DEFAULT, STANDARD_EXCLUSIONS } from "@off24/shared";
import type { WizardState } from "@/lib/wizardState";
import { StepNav } from "./Step1Qualificazione";

interface Props {
  savedQuoteId?: string;
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function Step5Revisione({ state, onChange, onBack, onSubmit, submitting, savedQuoteId }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);

  async function handleDownloadPdf() {
    if (!savedQuoteId) return;
    setPdfLoading(true);
    try { await api.quotes.downloadPdf(savedQuoteId); }
    finally { setPdfLoading(false); }
  }

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

  const appliedPrice = state.appliedPrice || prices.priceRecommended;
  const appliedMarginPct = costs.costTotal > 0
    ? Math.round(((appliedPrice - costs.costTotal) / appliedPrice) * 100)
    : 0;
  const needsApproval = appliedMarginPct < Math.round(MARGIN_MINIMUM * 100);

  function toggleExclusion(excl: string) {
    const next = state.exclusions.includes(excl)
      ? state.exclusions.filter((e) => e !== excl)
      : [...state.exclusions, excl];
    onChange({ exclusions: next });
  }

  const ALL_EXCLUSIONS = [
    ...STANDARD_EXCLUSIONS,
    "Smaltimento materiale esistente",
    "IVA",
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl mb-1.5">
          Revisione e <span className="text-accent">output</span>
        </h2>
        <p className="text-brand-muted text-sm">
          Controlla il preventivo, seleziona le esclusioni e scegli come procedere.
        </p>
      </div>

      {/* Alert approvazione */}
      {needsApproval && (
        <div className="border border-status-red/40 bg-status-red/8 p-4 flex gap-3">
          <span className="text-status-red text-lg">⚠</span>
          <div>
            <div className="font-semibold text-sm text-status-red">Margine sotto soglia — Approvazione necessaria</div>
            <div className="text-[12px] text-brand-muted mt-1">
              Il margine applicato ({appliedMarginPct}%) è inferiore al minimo aziendale ({Math.round(MARGIN_MINIMUM * 100)}%).
              Il preventivo verrà salvato come bozza in attesa di approvazione.
            </div>
          </div>
        </div>
      )}

      {/* Condizioni */}
      <div>
        <SectionLabel>Condizioni economiche</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Validità offerta</label>
            <select className="input" value={state.validityDays}
              onChange={(e) => onChange({ validityDays: parseInt(e.target.value) })}>
              <option value={15}>15 giorni</option>
              <option value={30}>30 giorni</option>
              <option value={60}>60 giorni</option>
            </select>
          </div>
          <div>
            <label className="field-label">Modalità di pagamento</label>
            <select className="input" value={state.paymentTerms}
              onChange={(e) => onChange({ paymentTerms: e.target.value })}>
              <option>30% anticipato, saldo consegna</option>
              <option>50% anticipato, 50% alla consegna</option>
              <option>100% anticipato</option>
              <option>Bonifico a 30gg</option>
            </select>
          </div>
        </div>
      </div>

      {/* Descrizione cliente */}
      <div>
        <label className="field-label">Descrizione per il cliente</label>
        <textarea
          className="input resize-none"
          rows={4}
          value={state.clientDescription}
          onChange={(e) => onChange({ clientDescription: e.target.value })}
          placeholder="Descrizione del lavoro come appare nel PDF cliente..."
        />
      </div>

      {/* Esclusioni */}
      <div>
        <SectionLabel>Esclusioni standard</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {ALL_EXCLUSIONS.map((excl) => {
            const checked = state.exclusions.includes(excl);
            return (
              <button key={excl} type="button" onClick={() => toggleExclusion(excl)}
                className={clsx(
                  "border flex items-center gap-2.5 px-3 py-2.5 text-left text-[12.5px] transition-colors",
                  checked ? "border-accent bg-accent/8" : "border-brand-border hover:border-accent/40"
                )}
              >
                <span className={clsx(
                  "w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center text-[10px]",
                  checked ? "bg-accent border-accent text-white" : "border-brand-border"
                )}>
                  {checked && "✓"}
                </span>
                <span>{excl}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ANTEPRIMA CLIENTE */}
      <div>
        <SectionLabel>Anteprima preventivo cliente</SectionLabel>
        <div className="card p-6 space-y-5">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-brand-border pb-5">
            <div>
              <div className="font-serif text-xl">Officina24 Srl</div>
              <div className="text-[12px] text-brand-muted mt-1">Via dell'Artigianato 12 — Bergamo</div>
              <div className="text-[12px] text-brand-muted">info@officina24srl.eu</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] text-brand-muted">N° preventivo</div>
              <div className="font-semibold">PV-{new Date().getFullYear()}-###</div>
              <div className="text-[12px] text-brand-muted mt-1">
                {new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div>
            <div className="text-[11px] text-brand-muted uppercase mb-1">OFFERTA A:</div>
            <div className="font-semibold">{state.clientName || "—"}</div>
          </div>

          {/* Descrizione */}
          <div className="text-[13.5px] leading-relaxed text-brand-subtle">
            {state.clientDescription || (
              <span className="text-brand-muted italic">La descrizione apparirà qui...</span>
            )}
          </div>

          {/* Importo */}
          <div className="bg-bg-tertiary px-5 py-4 flex justify-between items-center">
            <span className="text-[13px] text-brand-muted">Importo totale (IVA esclusa)</span>
            <span className="font-serif text-3xl text-accent">{fmt(appliedPrice)}</span>
          </div>

          {/* Esclusioni e condizioni */}
          <div className="text-[12px] text-brand-muted leading-relaxed space-y-1">
            {state.exclusions.length > 0 && (
              <div>
                <strong className="text-brand-subtle">Non incluso:</strong>{" "}
                {state.exclusions.join(", ")}.
              </div>
            )}
            <div>
              <strong className="text-brand-subtle">Validità offerta:</strong>{" "}
              {state.validityDays} giorni dalla data di emissione.
            </div>
            <div>
              <strong className="text-brand-subtle">Pagamento:</strong>{" "}
              {state.paymentTerms}.
            </div>
          </div>
        </div>
      </div>

      {/* Riepilogo finale */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <SummaryBox label="Costo pieno" value={fmt(costs.costTotal)} />
        <SummaryBox
          label="Margine applicato"
          value={`${appliedMarginPct}%`}
          valueClass={appliedMarginPct >= 30 ? "text-status-green" : appliedMarginPct >= 20 ? "text-accent" : "text-status-red"}
        />
        <SummaryBox
          label="Affidabilità"
          value={`${risk.reliabilityIndex}/100`}
          valueClass={risk.reliabilityIndex >= 70 ? "text-status-green" : "text-accent"}
        />
      </div>

      {/* Azioni finali */}
      <div className="flex justify-between items-center pt-6 border-t border-brand-border">
        <button type="button" className="btn-ghost" onClick={onBack}>← Indietro</button>
        <div className="flex gap-3">
          {savedQuoteId && (
            <button
              type="button"
              disabled={pdfLoading}
              className={clsx("btn-outline", pdfLoading && "opacity-60")}
              onClick={handleDownloadPdf}
            >
              {pdfLoading ? "Generazione..." : "⬇ Scarica PDF"}
            </button>
          )}
          <button
            type="button"
            disabled={submitting}
            className={clsx("btn-primary", submitting && "opacity-60")}
            onClick={onSubmit}
          >
            {submitting ? "Salvataggio..." : savedQuoteId ? "✓ Aggiorna" : needsApproval ? "Invia per approvazione" : "✓ Salva preventivo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-brand-muted tracking-[1.5px] font-bold uppercase mb-3">{children}</div>;
}

function SummaryBox({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-2">{label}</div>
      <div className={clsx("font-serif text-xl", valueClass ?? "text-brand-text")}>{value}</div>
    </div>
  );
}

function fmt(n: number) {
  return "€ " + Math.round(n).toLocaleString("it-IT");
}
