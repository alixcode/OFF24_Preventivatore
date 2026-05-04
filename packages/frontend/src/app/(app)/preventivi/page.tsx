"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/shared/Topbar";
import { api } from "@/lib/api";
import { clsx } from "clsx";

const STATUS_LABELS: Record<string, string> = {
  bozza: "Bozza",
  inviato: "Inviato",
  approvato: "Approvato",
  perso: "Perso",
  scaduto: "Scaduto",
};

const STATUS_BADGE: Record<string, string> = {
  bozza: "badge-yellow",
  inviato: "badge-blue",
  approvato: "badge-green",
  perso: "badge-red",
  scaduto: "badge-gray",
};

export default function PreventiviPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setLoading(true);
    api.quotes.list({ status: status || undefined, page }).then((res) => {
      setQuotes(res.data);
      setTotal(res.total);
      setLoading(false);
    });
  }, [status, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Preventivi"
        action={{ label: "+ Nuovo preventivo", href: "/preventivi/nuovo" }}
      />

      <div className="px-8 py-6 space-y-5">
        {/* Filtri status */}
        <div className="flex gap-2">
          {["", "bozza", "inviato", "approvato", "perso", "scaduto"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={clsx(
                "px-3 py-1.5 text-xs border transition-colors",
                status === s
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-brand-border text-brand-muted hover:border-accent/40"
              )}
            >
              {s === "" ? "Tutti" : STATUS_LABELS[s]}
            </button>
          ))}
          <span className="ml-auto text-xs text-brand-muted self-center">{total} preventivi</span>
        </div>

        {/* Tabella */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-brand-muted text-sm">Caricamento...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-[11px] text-brand-muted uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">Numero</th>
                  <th className="text-left px-4 py-3 font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium">Categoria</th>
                  <th className="text-left px-4 py-3 font-medium">Stato</th>
                  <th className="text-right px-4 py-3 font-medium">Prezzo</th>
                  <th className="text-right px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} className="border-b border-brand-border/50 hover:bg-bg-secondary/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-brand-muted">{q.number}</td>
                    <td className="px-4 py-3 font-medium">{q.client?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-brand-muted">{q.workCategory}</td>
                    <td className="px-4 py-3">
                      <span className={STATUS_BADGE[q.status] ?? "badge-gray"}>
                        {STATUS_LABELS[q.status] ?? q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {q.appliedPrice
                        ? `€ ${Math.round(q.appliedPrice).toLocaleString("it-IT")}`
                        : <span className="text-brand-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-brand-muted text-xs">
                      {new Date(q.createdAt).toLocaleDateString("it-IT")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/preventivi/${q.id}`} className="btn-outline text-xs px-3 py-1">
                        Apri
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && quotes.length === 0 && (
            <div className="text-center py-12 text-brand-muted text-sm">
              Nessun preventivo trovato.{" "}
              <Link href="/preventivi/nuovo" className="text-accent hover:underline">Crea il primo.</Link>
            </div>
          )}
        </div>

        {/* Paginazione */}
        {totalPages > 1 && (
          <div className="flex gap-2 justify-center">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
            >
              ← Precedente
            </button>
            <span className="text-xs text-brand-muted self-center">
              Pagina {page} di {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40"
            >
              Successiva →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
