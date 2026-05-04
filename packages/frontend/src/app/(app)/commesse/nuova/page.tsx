"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/shared/Topbar";
import { api } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("off24_token");
}

async function createJob(quoteId: string, notes?: string) {
  const token = getToken();
  const res = await fetch(`${BASE}/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ quoteId, notes }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Errore ${res.status}`);
  }
  return res.json();
}

export default function NuovaCommessaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get("quoteId") ?? "";
  const [quote, setQuote] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (quoteId) {
      api.quotes.get(quoteId).then(setQuote);
    }
  }, [quoteId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const job = await createJob(quoteId, notes || undefined);
      router.push(`/commesse/${job.id}`);
    } catch (err: any) {
      setError(err.message ?? "Errore durante la creazione");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Nuova commessa" />
      <div className="px-8 py-6 max-w-lg space-y-6">
        {error && (
          <div className="border border-status-red/40 bg-status-red/8 text-status-red px-4 py-3 text-sm">{error}</div>
        )}

        {quote && (
          <div className="card p-4 space-y-1">
            <div className="text-[11px] text-brand-muted uppercase tracking-wider">Preventivo collegato</div>
            <div className="font-semibold">{quote.number} — {quote.client?.name}</div>
            <div className="text-sm text-brand-muted">{quote.workCategory}</div>
            {quote.appliedPrice && (
              <div className="text-sm">Budget: <span className="font-medium text-accent">€ {Math.round(quote.appliedPrice).toLocaleString("it-IT")}</span></div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="field-label">Note iniziali (opzionale)</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Istruzioni operative, osservazioni..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/commesse" className="btn-ghost">Annulla</Link>
            <button type="submit" disabled={submitting || !quoteId} className="btn-primary ml-auto disabled:opacity-60">
              {submitting ? "Creazione..." : "Crea commessa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
