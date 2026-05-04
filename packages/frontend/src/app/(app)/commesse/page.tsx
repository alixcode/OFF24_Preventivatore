"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/shared/Topbar";
import { clsx } from "clsx";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("off24_token");
}

async function fetchJobs(status?: string, page = 1) {
  const token = getToken();
  const qs = new URLSearchParams({ page: String(page), ...(status ? { status } : {}) }).toString();
  const res = await fetch(`${BASE}/jobs?${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Errore caricamento commesse");
  return res.json();
}

const STATUS_LABELS: Record<string, string> = {
  aperta: "Aperta", in_lavorazione: "In lavorazione", completata: "Completata", fatturata: "Fatturata",
};
const STATUS_BADGE: Record<string, string> = {
  aperta: "badge-blue", in_lavorazione: "badge-yellow", completata: "badge-green", fatturata: "badge-gray",
};

function fmt(n: number | null | undefined) {
  if (!n) return "—";
  return "€ " + Math.round(n).toLocaleString("it-IT");
}

export default function CommessePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setLoading(true);
    fetchJobs(status || undefined, page).then((res) => {
      setJobs(res.data);
      setTotal(res.total);
      setLoading(false);
    });
  }, [status, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Commesse" />

      <div className="px-8 py-6 space-y-5">
        <div className="flex gap-2">
          {["", "aperta", "in_lavorazione", "completata", "fatturata"].map((s) => (
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
              {s === "" ? "Tutte" : STATUS_LABELS[s]}
            </button>
          ))}
          <span className="ml-auto text-xs text-brand-muted self-center">{total} commesse</span>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-brand-muted text-sm">Caricamento...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-[11px] text-brand-muted uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">Numero</th>
                  <th className="text-left px-4 py-3 font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium">Preventivo</th>
                  <th className="text-left px-4 py-3 font-medium">Stato</th>
                  <th className="text-right px-4 py-3 font-medium">Budget</th>
                  <th className="text-right px-4 py-3 font-medium">Apertura</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="border-b border-brand-border/50 hover:bg-bg-secondary/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-brand-muted">{j.number}</td>
                    <td className="px-4 py-3 font-medium">{j.quote?.client?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-brand-muted font-mono text-xs">{j.quote?.number ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={STATUS_BADGE[j.status] ?? "badge-gray"}>{STATUS_LABELS[j.status] ?? j.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{fmt(j.quote?.appliedPrice)}</td>
                    <td className="px-4 py-3 text-right text-brand-muted text-xs">
                      {new Date(j.openedAt).toLocaleDateString("it-IT")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/commesse/${j.id}`} className="btn-outline text-xs px-3 py-1">
                        Apri
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && jobs.length === 0 && (
            <div className="text-center py-12 text-brand-muted text-sm">
              Nessuna commessa.{" "}
              <Link href="/preventivi" className="text-accent hover:underline">Approva un preventivo per iniziare.</Link>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex gap-2 justify-center">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">← Precedente</button>
            <span className="text-xs text-brand-muted self-center">Pagina {page} di {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40">Successiva →</button>
          </div>
        )}
      </div>
    </div>
  );
}
