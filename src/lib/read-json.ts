export async function readResponseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      res.ok ? "Empty response from server" : `Request failed (${res.status})`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const snippet = text.replace(/\s+/g, " ").trim().slice(0, 180);
    if (
      res.status === 504 ||
      res.status === 502 ||
      res.status === 524 ||
      /an error occurred/i.test(text) ||
      /timed out|timeout/i.test(text)
    ) {
      throw new Error(
        "The scan hit a server time limit before it could finish. Try Scan again — Grants.gov results are saved if they already returned.",
      );
    }
    throw new Error(`Server returned a non-JSON error (${res.status}): ${snippet}`);
  }
}
