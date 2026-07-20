interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}

const STEPS = [
  { number: 1, label: 'Servicio' },
  { number: 2, label: 'Horario' },
  { number: 3, label: 'Mis datos' },
] as const;

function StepIndicator({ currentStep }: StepIndicatorProps) {
  if (currentStep === 4) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4">
      {STEPS.map((step, index) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;

        return (
          <div key={step.number} className="flex items-center flex-1 last:flex-initial">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              {isCompleted ? (
                <div className="w-8 h-8 rounded-full border-2 border-gold flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-gold"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      fill="none"
                    />
                  </svg>
                </div>
              ) : isActive ? (
                <div className="w-8 h-8 rounded-full bg-gold text-bg-base font-bold flex items-center justify-center text-sm">
                  {step.number}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-gold/20 text-text-muted flex items-center justify-center text-sm">
                  {step.number}
                </div>
              )}

              <span
                className={`text-xs mt-1 text-center ${
                  isActive ? 'text-gold' : 'text-text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line (not after the last step) */}
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 ${
                  step.number < currentStep ? 'bg-gold' : 'bg-gold/20'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StepIndicator;
