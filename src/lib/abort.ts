export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const message = "message" in error ? String(error.message) : "";
  return (
    name === "TimeoutError" ||
    name === "AbortError" ||
    /abort|timed out|timeout/i.test(message)
  );
}
