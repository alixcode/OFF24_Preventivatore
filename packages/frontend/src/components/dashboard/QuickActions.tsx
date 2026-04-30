import Link from "next/link";

const actions = [
  { icon: "+",  label: "Nuovo preventivo",  desc: "Wizard guidato 5 step", href: "/preventivi/nuovo" },
  { icon: "◫",  label: "Agg. prezzi",       desc: "Listino materiali",      href: "/materiali" },
  { icon: "◉",  label: "Apri commessa",     desc: "Da preventivo approvato",href: "/commesse" },
  { icon: "◌",  label: "Consuntivo",        desc: "Inserisci ore reali",    href: "/commesse" },
];

export function QuickActions() {
  return (
    <div>
      <div className="text-[11px] text-brand-muted tracking-[1.5px] font-bold uppercase mb-4">
        Azioni rapide
      </div>
      <div className="card">
        <div className="grid grid-cols-2 gap-2.5 p-4">
          {actions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="bg-bg-primary border border-brand-border p-3.5 hover:border-accent transition-colors block"
            >
              <div className="text-accent text-lg mb-2">{a.icon}</div>
              <div className="text-[12.5px] font-semibold">{a.label}</div>
              <div className="text-[11px] text-brand-muted mt-1">{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
