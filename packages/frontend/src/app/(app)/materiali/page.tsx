"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/shared/Topbar";
import { api } from "@/lib/api";
import { PRICE_VALIDITY_DAYS } from "@off24/shared";
import { clsx } from "clsx";

interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
  category: string;
  currentPrice: number;
  updatedAt: string;
  isPriceExpired?: boolean;
  notes?: string;
}

export default function MaterialiPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, { price: string; notes: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    api.materials.list().then((data) => {
      setMaterials(data);
      setLoading(false);
    });
  }, []);

  const expiredCount = materials.filter((m) => m.isPriceExpired).length;

  function startEdit(m: Material) {
    setEditing((prev) => ({
      ...prev,
      [m.id]: { price: m.currentPrice.toFixed(2), notes: m.notes ?? "" },
    }));
  }

  function cancelEdit(id: string) {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function savePrice(id: string) {
    const e = editing[id];
    if (!e) return;
    setSaving(id);
    try {
      await api.materials.updatePrice(id, {
        price: parseFloat(e.price),
        notes: e.notes || undefined,
      });
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, currentPrice: parseFloat(e.price), notes: e.notes, updatedAt: new Date().toISOString(), isPriceExpired: false }
            : m
        )
      );
      cancelEdit(id);
    } finally {
      setSaving(null);
    }
  }

  const categories = [...new Set(materials.map((m) => m.category))];
  const [catFilter, setCatFilter] = useState("all");

  const visible = materials.filter((m) => {
    const matchCat = catFilter === "all" || m.category === catFilter;
    const matchQ = !filter || m.name.toLowerCase().includes(filter.toLowerCase()) || m.code.toLowerCase().includes(filter.toLowerCase());
    return matchCat && matchQ;
  });

  if (loading) return <div className="p-8 text-brand-muted">Caricamento listino...</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Listino materiali" />

      <div className="px-8 py-6 space-y-6">
        {expiredCount > 0 && (
          <div className="border border-status-red/40 bg-status-red/8 px-4 py-3 flex gap-3 items-center">
            <span className="text-status-red text-lg">⚠</span>
            <div>
              <span className="text-sm font-semibold text-status-red">
                {expiredCount} {expiredCount === 1 ? "prezzo scaduto" : "prezzi scaduti"}
              </span>
              <span className="text-xs text-brand-muted ml-2">
                — aggiorna prima di creare nuovi preventivi
              </span>
            </div>
          </div>
        )}

        {/* Filtri */}
        <div className="flex gap-3 items-center">
          <input
            className="input max-w-[280px]"
            placeholder="Cerca materiale o codice..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <select className="input w-auto" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value="all">Tutte le categorie</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-xs text-brand-muted ml-auto">{visible.length} materiali</span>
        </div>

        {/* Tabella */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-[11px] text-brand-muted uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Codice</th>
                <th className="text-left px-4 py-3 font-medium">Materiale</th>
                <th className="text-left px-4 py-3 font-medium">Categoria</th>
                <th className="text-left px-4 py-3 font-medium">UM</th>
                <th className="text-right px-4 py-3 font-medium">Prezzo / UM</th>
                <th className="text-right px-4 py-3 font-medium">Aggiornato</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((m) => {
                const isEditing = !!editing[m.id];
                const e = editing[m.id];
                const daysOld = Math.floor((Date.now() - new Date(m.updatedAt).getTime()) / 86400000);

                return (
                  <tr key={m.id} className={clsx("border-b border-brand-border/50 hover:bg-bg-secondary/40 transition-colors", m.isPriceExpired && "bg-status-red/4")}>
                    <td className="px-4 py-3 font-mono text-xs text-brand-muted">{m.code}</td>
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-brand-muted">{m.category}</td>
                    <td className="px-4 py-3 text-brand-muted">{m.unit}</td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <input
                          className="input text-right w-28 py-1 text-sm"
                          value={e.price}
                          onChange={(ev) => setEditing((prev) => ({ ...prev, [m.id]: { ...prev[m.id], price: ev.target.value } }))}
                        />
                      ) : (
                        <span className={clsx("font-semibold", m.isPriceExpired && "text-status-red")}>
                          € {m.currentPrice.toFixed(2)}
                          {m.isPriceExpired && <span className="ml-1.5 text-[10px] border border-status-red/40 text-status-red px-1 py-0.5">SCADUTO</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-brand-muted text-xs">
                      {isEditing ? (
                        <input
                          className="input text-right w-36 py-1 text-xs"
                          placeholder="Note (opzionale)"
                          value={e.notes}
                          onChange={(ev) => setEditing((prev) => ({ ...prev, [m.id]: { ...prev[m.id], notes: ev.target.value } }))}
                        />
                      ) : (
                        <span title={`${daysOld} giorni fa`}>
                          {new Date(m.updatedAt).toLocaleDateString("it-IT")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => cancelEdit(m.id)}
                            className="btn-ghost text-xs px-2 py-1"
                          >
                            Annulla
                          </button>
                          <button
                            onClick={() => savePrice(m.id)}
                            disabled={saving === m.id}
                            className={clsx("btn-primary text-xs px-3 py-1", saving === m.id && "opacity-60")}
                          >
                            {saving === m.id ? "..." : "Salva"}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(m)}
                          className="btn-outline text-xs px-3 py-1"
                        >
                          Aggiorna prezzo
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && (
            <div className="text-center py-12 text-brand-muted text-sm">Nessun materiale trovato.</div>
          )}
        </div>

        <p className="text-xs text-brand-muted">
          I prezzi scadono dopo {PRICE_VALIDITY_DAYS} giorni dall'ultimo aggiornamento.
          Prezzi scaduti influenzano il calcolo del rischio nei preventivi.
        </p>
      </div>
    </div>
  );
}
