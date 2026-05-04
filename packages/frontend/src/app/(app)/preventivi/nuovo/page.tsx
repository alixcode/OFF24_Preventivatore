"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WizardProgress } from "@/components/wizard/WizardProgress";
import { WizardSidebar } from "@/components/wizard/WizardSidebar";
import { Step1Qualificazione } from "@/components/wizard/Step1Qualificazione";
import { Step2Configuratore } from "@/components/wizard/Step2Configuratore";
import { Step3Materiali } from "@/components/wizard/Step3Materiali";
import { Step4Prezzi } from "@/components/wizard/Step4Prezzi";
import { Step5Revisione } from "@/components/wizard/Step5Revisione";
import { INITIAL_STATE } from "@/lib/wizardState";
import { api } from "@/lib/api";
import type { WizardState } from "@/lib/wizardState";

export default function NuovoPreventivo() {
  const router = useRouter();
  const [step, setStep]         = useState(1);
  const [state, setState]       = useState<WizardState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  function patch(update: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...update }));
  }

  function goTo(n: number) {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.quotes.create({
        clientId:          state.clientId,
        workCategory:      state.workCategory,
        detailLevel:       state.detailLevel,
        urgency:           state.urgency,
        initialNotes:      state.initialNotes,
        material:          state.material || undefined,
        complexity:        state.complexity || undefined,
        widthMm:           state.widthMm ?? undefined,
        heightMm:          state.heightMm ?? undefined,
        depthMm:           state.depthMm ?? undefined,
        weightKg:          state.weightKg ?? undefined,
      });
      router.push("/preventivi");
    } catch (err: any) {
      setError(err.message ?? "Errore durante il salvataggio");
      setSubmitting(false);
    }
  }

  const stepProps = { state, onChange: patch };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Topbar */}
      <div className="bg-bg-secondary border-b border-brand-border px-8 py-4 flex items-center gap-5 sticky top-0 z-20">
        <div className="font-serif text-lg">OFF<span className="text-accent">24</span></div>
        <Link href="/dashboard" className="text-xs text-brand-muted hover:text-accent">← Dashboard</Link>
        <span className="text-brand-border">|</span>
        <span className="text-sm text-brand-muted">Nuovo preventivo</span>
      </div>

      <WizardProgress current={step} onGoTo={goTo} />

      <div className="flex flex-1">
        {/* Form area */}
        <div className="flex-1 px-10 py-8 max-w-[740px]">
          {error && (
            <div className="mb-6 border border-status-red/40 bg-status-red/8 text-status-red px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <Step1Qualificazione {...stepProps} onNext={() => goTo(2)} />
          )}
          {step === 2 && (
            <Step2Configuratore {...stepProps} onNext={() => goTo(3)} onBack={() => goTo(1)} />
          )}
          {step === 3 && (
            <Step3Materiali {...stepProps} onNext={() => goTo(4)} onBack={() => goTo(2)} />
          )}
          {step === 4 && (
            <Step4Prezzi {...stepProps} onNext={() => goTo(5)} onBack={() => goTo(3)} />
          )}
          {step === 5 && (
            <Step5Revisione
              {...stepProps}
              onBack={() => goTo(4)}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          )}
        </div>

        {/* Sidebar riepilogo live */}
        <WizardSidebar state={state} />
      </div>
    </div>
  );
}
