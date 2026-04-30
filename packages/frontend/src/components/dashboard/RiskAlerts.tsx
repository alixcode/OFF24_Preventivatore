const alerts = [
  { client: "Studio Bianchi",     desc: "Struttura portante — manca disegno", risk: 85, level: "high" as const },
  { client: "Costruzioni Rossi",  desc: "Scala elicoidale — input verbale",   risk: 45, level: "med"  as const },
  { client: "Fratelli Neri",      desc: "Ringhiera — urgenza alta",           risk: 20, level: "low"  as const },
];

const barColor = { high: "bg-status-red", med: "bg-accent", low: "bg-status-green" };
const textColor = { high: "text-status-red", med: "text-accent", low: "text-status-green" };

export function RiskAlerts() {
  return (
    <div>
      <div className="text-[11px] text-brand-muted tracking-[1.5px] font-bold uppercase mb-4">
        Alert margine
      </div>
      <div className="card">
        <div className="px-5 py-3.5 border-b border-brand-border flex justify-between items-center">
          <span className="font-semibold text-sm">Preventivi sotto soglia</span>
          <span className="text-[11px] text-status-red font-semibold">3 critici</span>
        </div>
        {alerts.map((a) => (
          <div key={a.client} className="flex items-start justify-between px-5 py-3.5 border-b border-brand-border last:border-0">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{a.client}</div>
              <div className="text-[11.5px] text-brand-muted mt-0.5">{a.desc}</div>
              <div className="mt-2 h-1 w-20 bg-brand-border rounded-full">
                <div
                  className={`h-full rounded-full ${barColor[a.level]}`}
                  style={{ width: `${a.risk}%` }}
                />
              </div>
            </div>
            <div className="text-right ml-4 flex-shrink-0">
              <div className={`text-sm font-bold ${textColor[a.level]}`}>{a.risk}%</div>
              <div className="text-[11px] text-brand-muted">rischio</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
