import { Topbar } from "@/components/shared/Topbar";

// Il wizard viene costruito in Fase 2
// Per ora è uno stub con navigazione funzionante
export default function NuovoPreventivo() {
  return (
    <>
      <Topbar title="Nuovo preventivo" subtitle="← Preventivi" />
      <div className="p-8">
        <div className="card max-w-2xl p-8 text-center">
          <div className="font-serif text-2xl mb-3">Wizard in costruzione</div>
          <p className="text-brand-muted text-sm">Il configuratore a 5 step viene sviluppato in Fase 2.</p>
        </div>
      </div>
    </>
  );
}
