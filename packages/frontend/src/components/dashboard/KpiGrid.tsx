"use client";

// Dati statici per ora — in Fase 2 si collegano all'API /dashboard/kpi
const kpis = [
  { label: "Preventivi aperti",  value: "12", delta: "+3 rispetto al mese scorso", up: true,    fill: 75 },
  { label: "Valore offerte",     value: "€ 84k", delta: "+12% vs marzo",          up: true,    fill: 60 },
  { label: "Margine medio",      value: "28%",   delta: "↓ -2pp — target 30%",   up: false,   fill: 28 },
  { label: "Commesse attive",    value: "5",     delta: "stabile",                up: null,    fill: 50 },
];

export function KpiGrid() {
  return (
    <div>
      <div className="text-[11px] text-brand-muted tracking-[1.5px] font-bold uppercase mb-4">
        Panoramica mese
      </div>
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-5">
            <div className="text-[11px] text-brand-muted tracking-wider uppercase font-bold mb-3">
              {k.label}
            </div>
            <div className="font-serif text-3xl mb-1.5">{k.value}</div>
            <div
              className={
                k.up === true
                  ? "text-status-green text-xs"
                  : k.up === false
                  ? "text-status-red text-xs"
                  : "text-brand-muted text-xs"
              }
            >
              {k.delta}
            </div>
            <div className="mt-3.5 h-0.5 bg-brand-border">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${k.fill}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
