import { clsx } from "clsx";

const STEPS = [
  { n: 1, label: "Qualificazione", sub: "Tipo e urgenza" },
  { n: 2, label: "Configuratore",  sub: "Dimensioni e lavorazioni" },
  { n: 3, label: "Materiali",      sub: "Listino e quantità" },
  { n: 4, label: "Prezzi",         sub: "Costi e margine" },
  { n: 5, label: "Revisione",      sub: "Output e invio" },
];

interface Props {
  current: number;
  onGoTo: (step: number) => void;
}

export function WizardProgress({ current, onGoTo }: Props) {
  return (
    <div className="bg-bg-secondary border-b border-brand-border px-8">
      <div className="flex">
        {STEPS.map(({ n, label, sub }) => {
          const done   = n < current;
          const active = n === current;
          return (
            <button
              key={n}
              onClick={() => done && onGoTo(n)}
              className={clsx(
                "flex-1 flex items-center gap-2.5 py-4 border-b-[3px] transition-colors text-left",
                done   && "border-status-green cursor-pointer",
                active && "border-accent cursor-default",
                !done && !active && "border-transparent opacity-40 cursor-default"
              )}
            >
              <span
                className={clsx(
                  "w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-bold border",
                  done   && "bg-status-green border-status-green text-white",
                  active && "bg-accent border-accent text-white",
                  !done && !active && "border-brand-border text-brand-muted"
                )}
              >
                {done ? "✓" : n}
              </span>
              <span className="hidden sm:block">
                <span className="block text-[13px] font-medium leading-tight">{label}</span>
                <span className="block text-[11px] text-brand-muted">{sub}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
