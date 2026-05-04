"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/shared/Topbar";
import { api } from "@/lib/api";
import { clsx } from "clsx";

const STATUS_LABELS: Record<string, string> = {
  bozza: "Bozza", inviato: "Inviato", approvato: "Approvato", perso: "Perso", scaduto: "Scaduto",
};
const STATUS_BADGE: Record<string, string> = {
  bozza: "badge-yellow", inviato: "badge-blue", approvato: "badge-green", perso: "badge-red", scaduto: "badge-gray",
};

function fmt(n: number) {
  return "€ " + Math.round(n).toLocaleString("it-IT");
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeVersion, setActiveVersion] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    api.quotes.get(id).then((q) => {
      setQuote(q);
      setActiveVersion(q.versions?.[0] ?? null);
      setLoading(false);
    });
  }, [id]);

  async function handleDownloadPdf() {
    setPdfLoading(true);
    try { await api.quotes.downloadPdf(id); }
    finally { setPdfLoading(false); }
  }

  if (loading) return <div className="p-8 text-brand-muted">Caricamento...</div>;
  if (!quote) return <div className="p-8 text-status-red">Preventivo non trovato.</div>;

  const hasJob = !!quote.status && quote.status === "approvato";

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title={quote.number}
        action={hasJob ? undefined : { label: "+ Crea commessa", href: `/commesse/nuova?quoteId=${id}` }}
      />

      <div className="px-8 py-6 space-y-6 max-w-5xl">
        {/* Header card */}
        <div className="card p-6 grid grid-cols-3 gap-6">
          <div>
            <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Cliente</div>
            <div className="font-semibold">{quote.client?.name ?? "—"}</div>
            {quote.client?.address && <div className="text-xs text-brand-muted mt-0.5">{quote.client.address}</div>}
          </div>
          <div>
            <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Categoria</div>
            <div className="font-medium">{quote.workCategory}</div>
            <div className="text-xs text-brand-muted mt-0.5">{quote.material ?? "—"} · {quote.complexity ?? "—"}</div>
          </div>
          <div>
            <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Stato</div>
            <span className={STATUS_BADGE[quote.status] ?? "badge-gray"}>{STATUS_LABELS[quote.status] ?? quote.status}</span>
            <div className="text-xs text-brand-muted mt-1.5">
              Creato il {new Date(quote.createdAt).toLocaleDateString("it-IT")}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Prezzo applicato</div>
            <div className="font-serif text-xl text-accent">{quote.appliedPrice ? fmt(quote.appliedPrice) : "—"}</div>
          </div>
          <div>
            <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Costo pieno</div>
            <div className="font-medium">{quote.costTotal ? fmt(quote.costTotal) : "—"}</div>
          </div>
          <div>
            <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-1">Margine</div>
            <div className={clsx("font-medium", quote.appliedMargin >= 30 ? "text-status-green" : quote.appliedMargin >= 20 ? "text-accent" : "text-status-red")}>
              {quote.appliedMargin ? `${Math.round(quote.appliedMargin)}%` : "—"}
            </div>
          </div>
        </div>

        {/* Versioni */}
        <div>
          <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-3">Versioni ({quote.versions?.length ?? 0})</div>
          {quote.versions?.length > 0 ? (
            <div className="flex gap-2 mb-4">
              {quote.versions.map((v: any) => (
                <button
                  key={v.id}
                  onClick={() => setActiveVersion(v)}
                  className={clsx(
                    "border px-3 py-1.5 text-xs transition-colors",
                    activeVersion?.id === v.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-brand-border text-brand-muted hover:border-accent/40"
                  )}
                >
                  Rev. {v.version}
                  {v.appliedPrice && <span className="ml-2 text-brand-muted">{fmt(v.appliedPrice)}</span>}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-brand-muted mb-4">Nessuna versione salvata.</div>
          )}

          {activeVersion && (
            <div className="card p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-[11px] text-brand-muted mb-1">Costo totale</div>
                  <div className="font-medium">{fmt(activeVersion.costTotal ?? 0)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-brand-muted mb-1">Prezzo applicato</div>
                  <div className="font-medium text-accent">{fmt(activeVersion.appliedPrice ?? 0)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-brand-muted mb-1">Margine</div>
                  <div className="font-medium">{activeVersion.appliedMargin ? `${Math.round(activeVersion.appliedMargin)}%` : "—"}</div>
                </div>
              </div>
              {activeVersion.changeNotes && (
                <div className="text-xs text-brand-muted border-t border-brand-border pt-3">
                  <strong className="text-brand-subtle">Note revisione: </strong>{activeVersion.changeNotes}
                </div>
              )}
              {activeVersion.items?.length > 0 && (
                <div>
                  <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-2">Voci ({activeVersion.items.length})</div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-brand-border text-brand-muted">
                        <th className="text-left pb-2">Descrizione</th>
                        <th className="text-right pb-2">Qtà</th>
                        <th className="text-right pb-2">P.unit.</th>
                        <th className="text-right pb-2">Totale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeVersion.items.map((item: any) => (
                        <tr key={item.id} className="border-b border-brand-border/40">
                          <td className="py-1.5">{item.description}</td>
                          <td className="py-1.5 text-right text-brand-muted">{item.quantity} {item.unit}</td>
                          <td className="py-1.5 text-right text-brand-muted">€ {item.unitPrice?.toFixed(2)}</td>
                          <td className="py-1.5 text-right font-medium">€ {item.total?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Approvazioni */}
        {quote.approvals?.length > 0 && (
          <div>
            <div className="text-[11px] text-brand-muted uppercase tracking-wider mb-3">Approvazioni</div>
            <div className="space-y-2">
              {quote.approvals.map((a: any) => (
                <div key={a.id} className="card px-4 py-3 flex gap-3 items-center text-sm">
                  <span className={clsx("text-lg", a.approved ? "text-status-green" : "text-status-red")}>
                    {a.approved ? "✓" : "✗"}
                  </span>
                  <div>
                    <span className="font-medium">{a.user?.name ?? "—"}</span>
                    <span className="text-brand-muted ml-2">{a.approved ? "Approvato" : "Rifiutato"}</span>
                    {a.notes && <span className="ml-2 text-brand-muted">— {a.notes}</span>}
                  </div>
                  <span className="ml-auto text-xs text-brand-muted">
                    {new Date(a.createdAt).toLocaleDateString("it-IT")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Azioni */}
        <div className="flex gap-3 pt-2 border-t border-brand-border">
          <Link href="/preventivi" className="btn-ghost text-sm">← Lista preventivi</Link>
          <div className="ml-auto flex gap-3">
            <button
              disabled={pdfLoading}
              onClick={handleDownloadPdf}
              className={clsx("btn-outline text-sm", pdfLoading && "opacity-60")}
            >
              {pdfLoading ? "Generazione..." : "⬇ PDF cliente"}
            </button>
            {quote.status === "approvato" && (
              <Link href={`/commesse/nuova?quoteId=${id}`} className="btn-primary text-sm">
                Apri commessa
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
