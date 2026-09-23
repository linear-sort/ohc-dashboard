const MAX_HASHES = 50;

export function parseHashList(raw: string): string[] {
  const seen = new Set<string>();
  const hashes: string[] = [];

  for (const line of raw.split(/[\n,]+/)) {
    const value = line.trim();
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    hashes.push(value);
  }

  return hashes;
}

export function validateHashBatch(hashes: string[]): {
  ok: true;
  hashes: string[];
} | {
  ok: false;
  message: string;
} {
  if (hashes.length === 0) {
    return { ok: false, message: "Enter at least one hash." };
  }
  if (hashes.length > MAX_HASHES) {
    return {
      ok: false,
      message: `Maximum ${MAX_HASHES} hashes per request (got ${hashes.length}). Remove some and try again.`,
    };
  }
  return { ok: true, hashes };
}

export { MAX_HASHES };
