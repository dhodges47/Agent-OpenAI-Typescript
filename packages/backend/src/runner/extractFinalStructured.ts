export function extractFinalStructured(runResult: any): string {
  const step = runResult?.state?._currentStep;
  const candidate = step?.output ?? runResult?.output;

  if (typeof candidate === "string") {
    return candidate;
  }

  if (candidate === null || candidate === undefined) {
    return "";
  }

  try {
    return JSON.stringify(candidate, null, 2);
  } catch {
    return String(candidate);
  }
}
