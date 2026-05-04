"use client";

import { useState } from "react";
import { clsx } from "clsx";
import type { WizardState, MaterialLine, OperationLine, ExternalCostLine } from "@/lib/wizardState";
import { StepNav } from "./Step1Qualificazione";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3Materiali({ state, onChange, onNext, onBack }: Props) {
  const [showAddMat, setShowAddMat] = useState(false);
  const [newMat, setNewMat] = useState<Partial<MaterialLine>>({});

  function updateMaterial(id: string, patch: Partial<MaterialLine>) {
    onChange({
      materialLines: state.materialLines.map((m) =>
        m.id === id ? { ...m, ...patch } : m
      ),
    });
  }

  function removeMaterial(id: string) {
    onChange({ materialLines: state.materialLines.filter((m) => m.id !== id) });
  }

  function addMaterial() {
    if (!newMat.name || !newMat.unit) return;
    const line: MaterialLine = {
      id: `mat-${Date.now()}`,
      name: newMat.name ?? "",
      unit: newMat.unit ?? "kg",
      quantity: newMat.quantity ?? 1,
      unitPrice: newMat.unitPrice ?? 0,
      isPriceExpired: false,
    };
    onChange({ materialLines: [...state.materialLines, line] });
    setNewMat({});
    setShowAddMat(false);
  }

  function updateOperation(id: string, patch: Partial<OperationLine>) {
    onChange({
      operationLines: state.operationLines.map((op) =>
        op.id === id ? { ...op, ...patch } : op
      ),
    });
  }

  function updateExternalCost(id: string, patch: Partial<ExternalCostLine>) {
    onChange({
      externalCosts: state.externalCosts.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    });
  }

  function addExternalCost() {
    onChange({
      externalCosts: [
        ...state.externalCosts,
        { id: `ext-${Date.now()}`, description: "", amount: 0 },
      ],
    });
  }

  function removeExternalCost(id: string) {
    onChange({ externalCosts: state.externalCosts.filter((c) => c.id !== id) });
  }

  const canProceed = state.operationLines.some((op) => op.hours > 0);

  const totalMat  = state.materialLines.reduce((s, m) => s + m.quantity * m.unitPrice, 0);
  const totalOps  = state.operationLines.reduce((s, op) => s + op.hours * op.hourlyRate, 0);
  const totalExt  = state.externalCosts.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl mb-1.5">
          Materiali e <span className="text-accent">lavorazioni</span>
        </h2>
        <p className="text-brand-muted text-sm">
          Inserisci quantità e prezzi. Le lavorazioni provengono dalla selezione precedente.
        </p>
      </div>

      {/* ── MATERIALI ── */}
      <Section label="Materiali" total={fmt(totalMat)}>
        {state.materialLines.length === 0 && (
          <div className="py-6 text-center text-brand-muted text-sm">Nessun materiale — aggiungi dal listino</div>
        )}
        {state.materialLines.length > 0 && (
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-border">
                {["Materiale", "UM", "Qtà", "€/UM", "Totale", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] text-brand-muted uppercase tracking-wider font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.materialLines.map((m) => (
                <tr key={m.id} className="border-b border-brand-border even:bg-bg-tertiary">
                  <td className="px-3 py-2.5">
                    <div className="text-sm font-medium">{m.name}</div>
                    {m.isPriceExpired && (
                      <div className="text-[11px] text-status-yellow">⚠ Prezzo da aggiornare</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-brand-muted text-sm">{m.unit}</td>
                  <td className="px-3 py-2.5">
                    <NumInput value={m.quantity} onChange={(v) => updateMaterial(m.id, { quantity: v })} />
                  </td>
                  <td className="px-3 py-2.5">
                    <NumInput value={m.unitPrice} onChange={(v) => updateMaterial(m.id, { unitPrice: v })}
                      className={m.isPriceExpired ? "text-status-yellow" : undefined} step={0.01} />
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-sm">{fmt(m.quantity * m.unitPrice)}</td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => removeMaterial(m.id)}
                      className="text-brand-muted hover:text-status-red text-lg leading-none">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Aggiungi materiale */}
        {showAddMat ? (
          <div className="p-3 border-t border-brand-border bg-bg-tertiary flex gap-2 items-end flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <label className="field-label">Nome materiale</label>
              <input className="input" placeholder="es. Tubo quadro 40×40×3 Fe"
                value={newMat.name ?? ""} onChange={(e) => setNewMat({ ...newMat, name: e.target.value })} />
            </div>
            <div className="w-20">
              <label className="field-label">UM</label>
              <select className="input" value={newMat.unit ?? "kg"}
                onChange={(e) => setNewMat({ ...newMat, unit: e.target.value })}>
                {["kg", "ml", "mq", "pz"].map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div className="w-24">
              <label className="field-label">Qtà</label>
              <input type="number" className="input" value={newMat.quantity ?? ""}
                onChange={(e) => setNewMat({ ...newMat, quantity: parseFloat(e.target.value) })} />
            </div>
            <div className="w-24">
              <label className="field-label">€/UM</label>
              <input type="number" step="0.01" className="input" value={newMat.unitPrice ?? ""}
                onChange={(e) => setNewMat({ ...newMat, unitPrice: parseFloat(e.target.value) })} />
            </div>
            <button className="btn-primary px-4 py-2.5" onClick={addMaterial}>Aggiungi</button>
            <button className="btn-ghost px-4 py-2.5" onClick={() => setShowAddMat(false)}>Annulla</button>
          </div>
        ) : (
          <button onClick={() => setShowAddMat(true)}
            className="text-accent text-[12.5px] px-3 py-2.5 hover:underline block">
            + Aggiungi materiale
          </button>
        )}
      </Section>

      {/* ── LAVORAZIONI ── */}
      <Section label="Lavorazioni (manodopera)" total={fmt(totalOps)}>
        {state.operationLines.length === 0 ? (
          <div className="py-6 text-center text-brand-muted text-sm">
            Nessuna lavorazione — torna allo step 2 per selezionarle
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-border">
                {["Fase", "Ore", "€/ora", "Totale"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] text-brand-muted uppercase tracking-wider font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.operationLines.map((op) => (
                <tr key={op.id} className="border-b border-brand-border even:bg-bg-tertiary">
                  <td className="px-3 py-2.5 text-sm font-medium">{op.name}</td>
                  <td className="px-3 py-2.5">
                    <NumInput value={op.hours} onChange={(v) => updateOperation(op.id, { hours: v })} step={0.5} />
                  </td>
                  <td className="px-3 py-2.5">
                    <NumInput value={op.hourlyRate} onChange={(v) => updateOperation(op.id, { hourlyRate: v })} />
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-sm">{fmt(op.hours * op.hourlyRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* ── COSTI ESTERNI ── */}
      <Section label="Costi esterni" total={fmt(totalExt)}>
        {state.externalCosts.map((c) => (
          <div key={c.id} className="flex gap-3 items-center px-3 py-2 border-b border-brand-border">
            <input className="input flex-1" placeholder="es. Trasporto, zincatura..."
              value={c.description} onChange={(e) => updateExternalCost(c.id, { description: e.target.value })} />
            <div className="flex items-center gap-1.5 w-32">
              <span className="text-brand-muted text-sm">€</span>
              <NumInput value={c.amount} onChange={(v) => updateExternalCost(c.id, { amount: v })} />
            </div>
            <button onClick={() => removeExternalCost(c.id)}
              className="text-brand-muted hover:text-status-red text-lg leading-none">×</button>
          </div>
        ))}
        <button onClick={addExternalCost}
          className="text-accent text-[12.5px] px-3 py-2.5 hover:underline block">
          + Aggiungi costo esterno
        </button>
      </Section>

      {!canProceed && (
        <div className="text-[12px] text-status-yellow">
          ⚠ Inserisci almeno le ore per una lavorazione prima di procedere
        </div>
      )}

      <StepNav onBack={onBack} onNext={onNext} canProceed={canProceed} />
    </div>
  );
}

function Section({ label, total, children }: { label: string; total?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] text-brand-muted tracking-[1.5px] font-bold uppercase">{label}</div>
        {total && <div className="text-[12px] text-brand-muted">Subtotale: <strong className="text-brand-text">{total}</strong></div>}
      </div>
      <div className="card">{children}</div>
    </div>
  );
}

function NumInput({ value, onChange, step = 1, className }: {
  value: number; onChange: (v: number) => void; step?: number; className?: string;
}) {
  return (
    <input
      type="number"
      step={step}
      value={value || ""}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className={clsx(
        "bg-transparent border-none text-right font-medium text-sm w-20 outline-none focus:border-b focus:border-accent",
        className
      )}
    />
  );
}

function fmt(n: number) {
  return "€ " + Math.round(n).toLocaleString("it-IT");
}
