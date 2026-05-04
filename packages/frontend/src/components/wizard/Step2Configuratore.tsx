"use client";

import { useEffect } from "react";
import { clsx } from "clsx";
import type { WizardState, OperationLine } from "@/lib/wizardState";
import { estimateWeight } from "@/lib/wizardState";
import { OPERATION_LABELS } from "@off24/shared";
import type { Material, Complexity, Operation } from "@off24/shared";
import { StepNav } from "./Step1Qualificazione";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const MATERIALS: { value: Material; label: string; sub: string }[] = [
  { value: "ferro_s235", label: "Ferro / Acciaio S235", sub: "Carpenteria standard" },
  { value: "inox_304",   label: "Acciaio inox 304",     sub: "Ambienti esterni / alimentari" },
  { value: "alluminio",  label: "Alluminio",             sub: "Leggerezza, antiscivolo" },
];

const COMPLEXITIES: { value: Complexity; label: string; sub: string }[] = [
  { value: "bassa",  label: "Bassa",  sub: "Elementi standard a catalogo" },
  { value: "media",  label: "Media",  sub: "Qualche elemento su misura" },
  { value: "alta",   label: "Alta",   sub: "Tutto realizzato su disegno" },
];

const ALL_OPERATIONS: { value: Operation; label: string }[] = [
  { value: "taglio_plasma",  label: "Taglio plasma" },
  { value: "saldatura_mig",  label: "Saldatura MIG" },
  { value: "saldatura_tig",  label: "Saldatura TIG" },
  { value: "piega_cnc",      label: "Piega CNC" },
  { value: "foratura",       label: "Foratura" },
  { value: "molatura",       label: "Molatura e finitura" },
  { value: "verniciatura",   label: "Verniciatura" },
  { value: "zincatura",      label: "Zincatura (est.)" },
  { value: "sabbiatura",     label: "Sabbiatura" },
  { value: "posa_in_opera",  label: "Posa in opera" },
];

// Tariffe default per lavorazione
const DEFAULT_RATES: Partial<Record<Operation, number>> = {
  taglio_plasma: 35, saldatura_mig: 38, saldatura_tig: 42,
  piega_cnc: 40, foratura: 30, molatura: 32, verniciatura: 30,
  zincatura: 0, sabbiatura: 32, posa_in_opera: 40,
};

export function Step2Configuratore({ state, onChange, onNext, onBack }: Props) {
  // Ricalcola peso quando cambiano dimensioni o materiale
  useEffect(() => {
    const w = estimateWeight(state.widthMm, state.heightMm, state.depthMm, state.material);
    if (w !== null) onChange({ weightKg: w });
  }, [state.widthMm, state.heightMm, state.depthMm, state.material]);

  function toggleOperation(op: Operation) {
    const selected = state.selectedOperations.includes(op);
    const next = selected
      ? state.selectedOperations.filter((o) => o !== op)
      : [...state.selectedOperations, op];

    const includesPosa = next.includes("posa_in_opera");
    onChange({ selectedOperations: next, includesPosa });

    // Sincronizza le righe lavorazioni nello step 3
    const updatedLines: OperationLine[] = next.map((o) => {
      const existing = state.operationLines.find((l) => l.id === o);
      return existing ?? {
        id: o,
        name: OPERATION_LABELS[o] ?? o,
        hours: 0,
        hourlyRate: DEFAULT_RATES[o as Operation] ?? 35,
      };
    });
    onChange({ operationLines: updatedLines });
  }

  const canProceed = state.material && state.complexity && state.selectedOperations.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl mb-1.5">
          Configuratore <span className="text-accent">tecnico</span>
        </h2>
        <p className="text-brand-muted text-sm">
          Inserisci le dimensioni stimate e seleziona le lavorazioni. Il peso viene calcolato automaticamente.
        </p>
      </div>

      {/* Dimensioni */}
      <div>
        <SectionLabel>Dimensioni stimate</SectionLabel>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Larghezza (mm)">
            <input type="number" className="input" placeholder="es. 3800"
              value={state.widthMm ?? ""} onChange={(e) => onChange({ widthMm: numOrNull(e.target.value) })} />
          </Field>
          <Field label="Altezza (mm)">
            <input type="number" className="input" placeholder="es. 1800"
              value={state.heightMm ?? ""} onChange={(e) => onChange({ heightMm: numOrNull(e.target.value) })} />
          </Field>
          <Field label="Profondità (mm)">
            <input type="number" className="input" placeholder="es. 60"
              value={state.depthMm ?? ""} onChange={(e) => onChange({ depthMm: numOrNull(e.target.value) })} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <Field label={<>Peso stimato (kg) <span className="text-accent text-[10px] ml-1">AUTO</span></>}>
            <input type="number" className="input text-accent" value={state.weightKg ?? ""}
              onChange={(e) => onChange({ weightKg: numOrNull(e.target.value) })}
              placeholder="calcolato automaticamente" />
          </Field>
          <Field label="Complessità">
            <select className="input" value={state.complexity}
              onChange={(e) => onChange({ complexity: e.target.value as Complexity })}>
              <option value="">— seleziona —</option>
              {COMPLEXITIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label} — {c.sub}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Materiale */}
      <div>
        <SectionLabel>Materiale principale</SectionLabel>
        <div className="grid grid-cols-3 gap-2.5">
          {MATERIALS.map((m) => (
            <button
              key={m.value} type="button"
              onClick={() => onChange({ material: m.value })}
              className={clsx(
                "border p-3.5 text-left transition-colors",
                state.material === m.value
                  ? "border-accent bg-accent/10"
                  : "border-brand-border hover:border-accent/40"
              )}
            >
              <div className="font-semibold text-[13px]">{m.label}</div>
              <div className="text-[11px] text-brand-muted mt-1">{m.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Lavorazioni */}
      <div>
        <SectionLabel>Lavorazioni incluse</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {ALL_OPERATIONS.map((op) => {
            const checked = state.selectedOperations.includes(op.value);
            return (
              <button key={op.value} type="button" onClick={() => toggleOperation(op.value)}
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
                {op.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Finitura */}
      <div>
        <SectionLabel>Trattamento superficiale</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Colore verniciatura">
            <input type="text" className="input" value={state.finishColor}
              onChange={(e) => onChange({ finishColor: e.target.value })}
              placeholder="es. RAL 7016 grigio antracite" />
          </Field>
          <Field label="Tipo finitura">
            <select className="input" value={state.finishType}
              onChange={(e) => onChange({ finishType: e.target.value })}>
              <option value="opaco">Opaco</option>
              <option value="satinato">Satinato</option>
              <option value="lucido">Lucido</option>
            </select>
          </Field>
        </div>
      </div>

      <StepNav onBack={onBack} onNext={onNext} canProceed={!!canProceed} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] text-brand-muted tracking-[1.5px] font-bold uppercase mb-3">{children}</div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-brand-subtle uppercase tracking-wider mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function numOrNull(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}
