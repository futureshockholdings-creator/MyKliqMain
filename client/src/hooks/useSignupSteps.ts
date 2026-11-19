import { useCallback, useEffect, useState } from "react";

type SignupStep = 1 | 2 | 3;

/**
 * Keep browser/PWA Back on the previous signup step without unmounting the form.
 * History contains step metadata only, never profile or security field values.
 */
export function useSignupSteps() {
  const [currentStep, setCurrentStep] = useState<SignupStep>(1);
  const [flowId] = useState(() => crypto.randomUUID());

  useEffect(() => {
    window.history.replaceState({
      ...window.history.state,
      mykliqSignupStep: { flowId, step: 1 },
    }, "", window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      const entry = event.state?.mykliqSignupStep;
      if (entry?.flowId === flowId && [1, 2, 3].includes(entry.step)) {
        setCurrentStep(entry.step);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [flowId]);

  const goToStep = useCallback((step: SignupStep) => {
    window.history.pushState({
      ...window.history.state,
      mykliqSignupStep: { flowId, step },
    }, "", window.location.href);
    setCurrentStep(step);
  }, [flowId]);

  const goBack = useCallback(() => {
    if (currentStep > 1) window.history.back();
  }, [currentStep]);

  return { currentStep, goToStep, goBack };
}
