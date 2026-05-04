"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/shared/Topbar";
import { clsx } from "clsx";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("off24_token");
}

async function apiFetch(path: string, options?: RequestInit) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Errore ${res.status}`);
  }
  return res.json();
}

const STATUS_LABELS: Record<string, string> = {
  aperta: "Aperta", in_lavorazione: "In lavorazione", completata: "Completata", fatturata: "Fatturata",
};
const STATUS_BADGE: Record<string, string> = {
  aperta: "badge-blue", in_lavorazione: "badge-yellow", completata: "badge-green", fatturata: "badge-gray",
};
const NEXT_STATUS: Record<string, string> = {
  aperta: "in_lavorazione", in_lavorazione: "completata", completata: "fatturata",
};
const NEXT_LABEL: Record<string, string> = {
  aperta: "Avvia lavorazione", in_lavorazione: "Segna completata", completata: "Segna fatturata",
};

const ACTUAL_TYPES = ["manodopera", "materiale", "costo_esterno"] as const;

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return "€ " + Math.round(n).toLocaleString("it-IT");
}

function pct(actual: number, budget: number) {
  if (!budget) return null;
  return Math.round(((actual - budget) / budget) * 100);
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<any>(null);
  const [actuals, setActuals] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // new actual form
  const [showForm, setShowForm] = useState(false);
  const [newActual, setNewActual] = useState({
    type: "materiale" as typeof ACTUAL_TYPES[number],
    description: "",
    quantity: "1",
    unitCost: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function reload() {
    const [jobData, actualsData, compData] = await Promise.all([
      apiFetch(`/jobs/${id}`),
      apiFetch(`/jobs/${id}/actuals`),
      apiFetch(`/jobs/${id}/comparison`),
    ]);
    setJob(jobData);
    setActuals(actualsData);
    setComparison(compData);
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [id]);

  async function advanceStatus() {
    if (!job || !NEXT_STATUS[job.status]) return;
    setStatusUpdating(true);
    try {
      await apiFetch(`/jobs/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: NEXT_STATUS[job.status] }),
      });
      await reload();
    } finally {
      setStatusUpdating(false);
    }
  }

  async function addActual(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await apiFetch(`/jobs/${id}/actuals`, {
        method: "POST",
        body: JSON.stringify({
          type: newActual.type,
          description: newActual.description,
          quantity: parseFloat(newActual.quantity),
          unitCost: parseFloat(newActual.unitCost),
          notes: newActual.notes || undefined,
        }),
      });
      setNewActual({ type: "materiale", description: "", quantity: "1", unitCost: "", notes: "" });
      setShowForm(false);
      await reload();
    } catch (err: any) {
      setFormError(err.message ?? "Errore");
    } finally {
      setSaving(false);
    }
  }

  async function deleteActual(actualId: string) {
    if (!confirm("Eliminare questa voce consuntivo?")) return;
    await apiFetch(`/jobs/${id}/actuals/${actualId}`, { method: "DELETE" });
    await reload();
  }

  if (loading) return <div className="p-8 text-brand-muted">Caricamento...</div>;
  if (!job) return <div className="p-8 text-status-red">Commessa non trovata.</div>;

  // positive variance = under budget (good), negative = over budget (bad)
  const variancePct = comparison?.variance?.percentage;
  const varianceColor = variancePct == null ? "" : variancePct >= 0 ? "text-status-green" : variancePct >= -10 ? "text-accent" : "text-status-red";

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title={job.number} />

      <div className="px-8 py-6 space-y-6 max-w-5xl">
        {/* Header card */}
        <div className="card p-6 grid grid-cols-4 gap-5">
          <div>
            <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Cliente</div>
            <div className="font-semibold">{job.quote?.client?.name ?? "—"}</div>
            <div className="text-xs text-brand-muted mt-0.5">{job.quote?.number}</div>
          </div>
          <div>
            <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Stato</div>
            <span className={STATUS_BADGE[job.status] ?? "badge-gray"}>{STATUS_LABELS[job.status] ?? job.status}</span>
          </div>
          <div>
            <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Budget preventivo</div>
            <div className="font-serif text-lg text-accent">{fmt(job.quote?.appliedPrice)}</div>
          </div>
          <div>
            <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Apertura</div>
            <div className="text-sm">{new Date(job.openedAt).toLocaleDateString("it-IT")}</div>
            {job.closedAt && <div className="text-xs text-brand-muted mt-0.5">Chiusa {new Date(job.closedAt).toLocaleDateString("it-IT")}</div>}
          </div>
        </div>

        {/* Riepilogo scostamento */}
        {comparison && (
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-2">Budget (preventivo)</div>
              <div className="font-serif text-xl text-accent">{fmt(comparison.quote?.appliedPrice)}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-2">Consuntivo totale</div>
              <div className="font-serif text-xl">{fmt(comparison.actuals?.total)}</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-2">Scostamento</div>
              {variancePct != null ? (
                <div className={clsx("font-serif text-xl", varianceColor)}>
                  {variancePct > 0 ? "+" : ""}{variancePct}%
                  <div className="text-xs mt-0.5">{fmt(comparison.variance?.amount)}</div>
                </div>
              ) : (
                <div className="font-serif text-xl text-brand-muted">—</div>
              )}
            </div>
          </div>
        )}

        {/* Consuntivo righe */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] text-brand-muted uppercase tracking-wider">Voci consuntivo ({actuals.length})</div>
            {job.status !== "fatturata" && (
              <button onClick={() => setShowForm(!showForm)} className="btn-outline text-xs px-3 py-1.5">
                {showForm ? "Annulla" : "+ Aggiungi voce"}
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={addActual} className="card p-4 mb-4 space-y-3">
              {formError && <div className="text-status-red text-xs">{formError}</div>}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="field-label">Tipo</label>
                  <select className="input" value={newActual.type} onChange={(e) => setNewActual((p) => ({ ...p, type: e.target.value as any }))}>
                    {ACTUAL_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="field-label">Descrizione</label>
                  <input className="input" required value={newActual.description} onChange={(e) => setNewActual((p) => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="field-label">Quantità</label>
                  <input className="input" type="number" min="0" step="any" required value={newActual.quantity} onChange={(e) => setNewActual((p) => ({ ...p, quantity: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Costo unitario (€)</label>
                  <input className="input" type="number" min="0" step="any" required value={newActual.unitCost} onChange={(e) => setNewActual((p) => ({ ...p, unitCost: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">Note (opzionale)</label>
                  <input className="input" value={newActual.notes} onChange={(e) => setNewActual((p) => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-xs">Annulla</button>
                <button type="submit" disabled={saving} className={clsx("btn-primary text-xs", saving && "opacity-60")}>
                  {saving ? "Salvataggio..." : "Aggiungi voce"}
                </button>
              </div>
            </form>
          )}

          <div className="card overflow-hidden">
            {actuals.length === 0 ? (
              <div className="py-10 text-center text-brand-muted text-sm">Nessuna voce consuntivo registrata.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border text-[11px] text-brand-muted uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">Tipo</th>
                    <th className="text-left px-4 py-3 font-medium">Descrizione</th>
                    <th className="text-right px-4 py-3 font-medium">Qtà</th>
                    <th className="text-right px-4 py-3 font-medium">C. unit.</th>
                    <th className="text-right px-4 py-3 font-medium">Totale</th>
                    <th className="text-right px-4 py-3 font-medium">Data</th>
                    {job.status !== "fatturata" && <th className="px-4 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {actuals.map((a) => (
                    <tr key={a.id} className="border-b border-brand-border/50">
                      <td className="px-4 py-2.5">
                        <span className={clsx("text-[11px] px-1.5 py-0.5 border",
                          a.type === "materiale" ? "border-blue-500/40 text-blue-400" :
                          a.type === "lavorazione" ? "border-accent/40 text-accent" :
                          "border-brand-border text-brand-muted"
                        )}>
                          {a.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">{a.description}</td>
                      <td className="px-4 py-2.5 text-right text-brand-muted">{a.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-brand-muted">€ {a.unitCost?.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">€ {a.total?.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-brand-muted">
                        {new Date(a.recordedAt).toLocaleDateString("it-IT")}
                      </td>
                      {job.status !== "fatturata" && (
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => deleteActual(a.id)} className="text-brand-muted hover:text-status-red text-xs transition-colors">✕</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-brand-border bg-bg-secondary/60">
                    <td colSpan={4} className="px-4 py-3 text-xs text-brand-muted font-semibold">Totale consuntivo</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {fmt(actuals.reduce((s, a) => s + (a.total ?? 0), 0))}
                    </td>
                    <td colSpan={job.status !== "fatturata" ? 2 : 1}></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* Avanzamento stato */}
        <div className="flex gap-3 pt-2 border-t border-brand-border">
          <Link href="/commesse" className="btn-ghost text-sm">← Lista commesse</Link>
          {NEXT_STATUS[job.status] && (
            <button
              onClick={advanceStatus}
              disabled={statusUpdating}
              className={clsx("btn-primary text-sm ml-auto", statusUpdating && "opacity-60")}
            >
              {statusUpdating ? "..." : NEXT_LABEL[job.status]}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
