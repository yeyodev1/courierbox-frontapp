const PROMPT_LEAK_MARKERS: RegExp[] = [
  /instruccion(?:es)?\s+de\s+extracci[oó]n/i,
  /identificaci[oó]n\s+del\s+paquete/i,
  /limpieza\s+de\s+datos/i,
  /formato\s+de\s+salida/i,
  /eliminar\s+por\s+completo/i,
  /sustituir\s+el\s+campo/i,
  /datos\s+de\s+origen/i,
  /warehouse\s+receipt/i,
  /n[uú]mero\s+de\s+wr/i,
  /\bCR[IÍ]TICO\b/,
  /campovalor\s+a\s+mostrar/i,
  /consignatario\s+o\s+cualquier\s+nombre/i,
  /received\s+date/i,
  /shipper\s*\(remitente\)/i,
];

const STRIP_FRAGMENTS: RegExp[] = [
  /instruccion(?:es)?\s+de\s+extracci[oó]n:?.*?(?=(?:\n|$))/gis,
  /limpieza\s+de\s+datos\s*\(cr[ií]tico\):?.*?(?=(?:\n|$))/gis,
  /formato\s+de\s+salida[^.]*\./gis,
];

const looksLikePromptLeak = (text: string): boolean =>
  PROMPT_LEAK_MARKERS.some((re) => re.test(text));

export function sanitizeText(
  input: string | null | undefined,
  fallback: string | null = null,
): string | null {
  if (input == null) return fallback;
  const trimmed = String(input).trim();
  if (!trimmed) return fallback;

  if (looksLikePromptLeak(trimmed)) {
    let stripped = trimmed;
    for (const re of STRIP_FRAGMENTS) stripped = stripped.replace(re, " ");
    stripped = stripped.replace(/\s{2,}/g, " ").trim();
    if (!stripped || looksLikePromptLeak(stripped)) return fallback;
    return stripped;
  }

  return trimmed;
}

export function sanitizeConsignee(
  input: string | null | undefined,
  fallbackTracking: string | null = null,
): string | null {
  const cleaned = sanitizeText(input, null);
  if (!cleaned) return fallbackTracking;
  if (/^\s*\d{6,}\s*$/.test(cleaned)) return cleaned;
  if (cleaned.toLowerCase().includes("consignatario")) return fallbackTracking;
  return fallbackTracking ?? cleaned;
}
