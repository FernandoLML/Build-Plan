// Caminho: /frontend/src/components/memorial/MemorialStepper.tsx
// Stepper horizontal discreto do fluxo de importação do memorial.

import { Check } from "lucide-react";

const STEPS = [
  { n: 1, label: "Upload do Arquivo" },
  { n: 2, label: "Conferência dos Itens" },
  { n: 3, label: "Confirmação" },
];

export function MemorialStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3">
      {STEPS.map((step, idx) => {
        const done = step.n < currentStep;
        const active = step.n === currentStep;
        return (
          <div key={step.n} className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-500"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : step.n}
              </span>
              <span
                className={`text-sm ${active ? "font-medium text-slate-100" : "text-slate-500"}`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && <div className="h-px flex-1 bg-slate-800" />}
          </div>
        );
      })}
    </div>
  );
}