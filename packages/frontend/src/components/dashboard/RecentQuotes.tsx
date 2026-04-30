import Link from "next/link";
import type { QuoteStatus } from "@off24/shared";

const quotes = [
  { id: "1", number: "PV-2026-041", client: "Costruzioni Rossi",  desc: "Scala elicoidale inox — 3 rampe",        price: 14800, status: "inviato"   as QuoteStatus, date: "29 apr" },
  { id: "2", number: "PV-2026-040", client: "Logistica Verdi SpA", desc: "Cancello scorrevole automatico",          price: 6200,  status: "approvato" as QuoteStatus, date: "28 apr" },
  { id: "3", number: "PV-2026-039", client: "Studio Bianchi",      desc: "Struttura portante magazzino",            price: 31500, status: "bozza"     as QuoteStatus, date: "27 apr" },
  { id: "4", number: "PV-2026-038", client: "Edilmetal Snc",       desc: "Pensilina acciaio zincato",               price: 8900,  status: "commessa"  as QuoteStatus, date: "25 apr" },
  { id: "5", number: "PV-2026-037", client: "Fratelli Neri",       desc: "Ringhiera terrazzo — 28ml",               price: 4100,  status: "perso"     as QuoteStatus, date: "22 apr" },
];

const statusLabel: Record<string, string> = {
  bozza: "Bozza", inviato: "Inviato", approvato: "Approvato",
  perso: "Perso", scaduto: "Scaduto", commessa: "In commessa",
};

export function RecentQuotes() {
  return (
    <div>
      <div className="text-[11px] text-brand-muted tracking-[1.5px] font-bold uppercase mb-4">
        Preventivi recenti
      </div>
      <div className="card">
        <div className="px-5 py-3.5 border-b border-brand-border flex justify-between items-center">
          <span className="font-semibold text-sm">Ultimi 30 giorni</span>
          <Link href="/preventivi" className="text-xs text-accent hover:underline">Vedi tutti →</Link>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-brand-border">
              {["N°", "Cliente", "Descrizione", "Importo", "Stato", "Data"].map((h) => (
                <th key={h} className="px-5 py-2.5 text-left text-[11px] text-brand-muted tracking-wider uppercase font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quotes.map((q, i) => (
              <tr
                key={q.id}
                className={`border-b border-brand-border cursor-pointer hover:bg-accent/5 transition-colors ${i % 2 === 1 ? "bg-bg-tertiary" : ""}`}
              >
                <td className="px-5 py-3 text-brand-muted text-xs">{q.number}</td>
                <td className="px-5 py-3 font-medium">{q.client}</td>
                <td className="px-5 py-3 text-brand-subtle text-[12.5px]">{q.desc}</td>
                <td className="px-5 py-3 font-semibold">
                  € {q.price.toLocaleString("it-IT")}
                </td>
                <td className="px-5 py-3">
                  <span className={`badge-${q.status}`}>{statusLabel[q.status]}</span>
                </td>
                <td className="px-5 py-3 text-brand-muted text-xs">{q.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
