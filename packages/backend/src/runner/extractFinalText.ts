export function extractFinalText(runResult: any): string {
  // Preferred: the SDK’s “final output” step
  const step = runResult?.state?._currentStep;
  if (step?.type === "next_step_final_output" && typeof step.output === "string") {
    return step.output;
  }

  // Fallback: sometimes output exists without the exact step type check
  if (typeof step?.output === "string") {
    return step.output;
  }

  // Conservative fallbacks (avoid parsing raw provider arrays unless you must)
  if (typeof runResult?.output === "string") {
    return runResult.output;
  }

  return "";
}
