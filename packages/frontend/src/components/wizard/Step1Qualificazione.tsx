"use client";

import { clsx } from "clsx";
import { calculateRisk } from "@off24/shared";
import type { WizardState } from "@/lib/wizardState";
import type { WorkCategory, DetailLevel, Urgency } from "@off24/shared";

interface Props {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
  onNext: () => void;
}

const CATEGORIES: { value: WorkCategory; icon: string; label: string; sub: string }[] = [
  { value: "scale",     icon: "⌇", label: "Scale",     sub: "Elicoidali, lineari, retrattili" },
  { value: "cancelli",  icon: "▦", label: "Cancelli",  sub: "Scorrevoli, battenti, automatici" },
  { value: "strutture", icon: "⊞", label: "Strutture", sub: "Portanti, capannoni, soppalchi" },
  { value: "pensiline", icon: "⊓", label: "Pensiline", sub: "Acciaio zincato, policarbonato" },
  { value: "ringhiere", icon: "⊟", label: "Ringhiere", sub: "Parapetti, recinzioni, balaustre" },
  { value: "altro",     icon: "◦", label: "Altro",     sub: "Carpenteria su specifica" },
];

const DETAIL_LEVELS: { value: DetailLevel; label: string; sub: string }[] = [
  { value: "verbale",         label: "Verbale",        sub: "Solo descrizione a voce / testo" },
  { value: "foto_schizzo",    label: "Foto / Schizzo", sub: "Immagini o disegno a mano" },
  { value: "disegno_tecnico", label: "Disegno tecnico", sub: "DXF, DWG, PDF quotato" },
];

const URGENCIES: { value: Urgency; label: string; sub: string }[] = [
  { value: "normale",       label: "Normale",       sub: "Tempi standard officina" },
  { value: "urgente",       label: "Urgente",       sub: "Entro 2 settimane" },
  { value: "urgentissimo",  label: "Urgentissimo",  sub: "Entro 5 giorni lavorativi" },
];

export function Step1Qualificazione({ state, onChange, onNext }: Props) {
  const risk = calculateRisk({
    missingDrawings: state.detailLevel !== "disegno_tecnico",
    inputLevelPhoto: state.detailLevel === "foto_schizzo",
    inputLevelVerbal: state.detailLevel === "verbale",
    urgencyHigh: state.urgency === "urgente",
    urgencyVeryHigh: state.urgency === "urgentissimo",
    isNewClient: state.isNewClient,
    includesPosa: state.includesPosa,
    estimatedDimensions: 0,
  });

  const canProceed = state.clientId && state.workCategory && state.detailLevel && state.urgency;

  const statusColor = {
    preventivabile: "border-status-green/40 bg-status-green/5",
    stimabile: "border-status-yellow/40 bg-status-yellow/5",
    non_preventivabile: "border-status-red/40 bg-status-red/5",
  }[risk.status] ?? "border-brand-border bg-bg-secondary";

  const statusIcon = { preventivabile: "✓", stimabile: "⚠", non_preventivabile: "✕" }[risk.status];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl mb-1.5">
          Qualificazione <span className="text-accent">richiesta</span>
        </h2>
        <p className="text-brand-muted text-sm">
          Bastano pochi dati per avere una prima stima dell'affidabilità del preventivo.
        </p>
      </div>

      {/* Cliente */}
      <Field label="Cliente">
        <select
          className="input"
          value={state.clientId}
          onChange={(e) => {
            const opt = e.target.selectedOptions[0];
            onChange({
              clientId: e.target.value,
              clientName: opt.text,
              isNewClient: opt.dataset.new === "true",
            });
          }}
        >
          <option value="">— seleziona cliente —</option>
          <option value="client-rossi"  data-new="false">Costruzioni Rossi</option>
          <option value="client-verdi"  data-new="false">Logistica Verdi SpA</option>
          <option value="client-bianchi" data-new="true">Studio Bianchi (nuovo)</option>
          <option value="__new__"       data-new="true">+ Nuovo cliente...</option>
        </select>
      </Field>

      {/* Categoria */}
      <Field label="Tipo lavorazione">
        <div className="grid grid-cols-3 gap-2.5">
          {CATEGORIES.map((c) => (
            <RadioCard
              key={c.value}
              selected={state.workCategory === c.value}
              onClick={() => onChange({ workCategory: c.value })}
            >
              <div className="text-accent text-xl mb-2">{c.icon}</div>
              <div className="font-semibold text-[13px]">{c.label}</div>
              <div className="text-[11px] text-brand-muted mt-1">{c.sub}</div>
            </RadioCard>
          ))}
        </div>
      </Field>

      {/* Livello dettaglio */}
      <Field label="Livello di dettaglio richiesta">
        <div className="grid grid-cols-3 gap-2.5">
          {DETAIL_LEVELS.map((d) => (
            <RadioCard
              key={d.value}
              selected={state.detailLevel === d.value}
              onClick={() => onChange({ detailLevel: d.value })}
            >
              <div className="font-semibold text-[13px]">{d.label}</div>
              <div className="text-[11px] text-brand-muted mt-1">{d.sub}</div>
            </RadioCard>
          ))}
        </div>
      </Field>

      {/* Urgenza */}
      <Field label="Urgenza">
        <div className="grid grid-cols-3 gap-2.5">
          {URGENCIES.map((u) => (
            <RadioCard
              key={u.value}
              selected={state.urgency === u.value}
              onClick={() => onChange({ urgency: u.value })}
            >
              <div className="font-semibold text-[13px]">{u.label}</div>
              <div className="text-[11px] text-brand-muted mt-1">{u.sub}</div>
            </RadioCard>
          ))}
        </div>
      </Field>

      {/* Note */}
      <Field label="Note iniziali (facoltativo)">
        <textarea
          className="input resize-none"
          rows={3}
          value={state.initialNotes}
          onChange={(e) => onChange({ initialNotes: e.target.value })}
          placeholder="Es. cancello scorrevole per accesso carrabile, larghezza ca. 4mt..."
        />
      </Field>

      {/* Status qualificazione */}
      {state.workCategory && state.detailLevel && state.urgency && (
        <div className={`border p-4 flex gap-4 ${statusColor}`}>
          <div className="text-xl">{statusIcon}</div>
          <div>
            <div className="font-bold text-sm mb-1">
              {{ preventivabile: "Preventivabile", stimabile: "Stimabile — Affidabilità ridotta", non_preventivabile: "Non preventivabile — Troppi dati mancanti" }[risk.status]}
            </div>
            {risk.suggestions.length > 0 && (
              <div className="text-[12px] text-brand-muted space-y-0.5">
                {risk.suggestions.map((s, i) => <div key={i}>{s}</div>)}
              </div>
            )}
          </div>
          <div className="ml-auto text-right flex-shrink-0">
            <div className="text-[11px] text-brand-muted mb-1">Affidabilità</div>
            <div className="font-serif text-2xl">{risk.reliabilityIndex}<span className="text-sm text-brand-muted">/100</span></div>
          </div>
        </div>
      )}

      <StepNav onNext={onNext} canProceed={!!canProceed} />
    </div>
  );
}

// ─── Componenti locali ───────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-brand-subtle uppercase tracking-wider mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function RadioCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "border p-3.5 text-left transition-colors cursor-pointer w-full",
        selected
          ? "border-accent bg-accent/10"
          : "border-brand-border hover:border-accent/40 hover:bg-accent/4"
      )}
    >
      {children}
    </button>
  );
}

export function StepNav({
  onBack, onNext, canProceed, nextLabel, backLabel,
}: {
  onBack?: () => void;
  onNext: () => void;
  canProceed: boolean;
  nextLabel?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex justify-between items-center pt-6 border-t border-brand-border mt-2">
      {onBack ? (
        <button type="button" className="btn-ghost" onClick={onBack}>
          {backLabel ?? "← Indietro"}
        </button>
      ) : (
        <div />
      )}
      <button
        type="button"
        className={clsx("btn-primary", !canProceed && "opacity-40 cursor-not-allowed")}
        onClick={canProceed ? onNext : undefined}
        disabled={!canProceed}
      >
        {nextLabel ?? "Avanti →"}
      </button>
    </div>
  );
}
