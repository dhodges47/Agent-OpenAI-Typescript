export type EngineRow = {
  manufacturer: string | null;
  model: string | null;
  displacement_l: number | null;
  number_of_cylinders: number | null;
  cylinder_configuration: string | null;
};

export type CandidateInput = {
  manufacturer?: string | null;
  model?: string | null;
  displacement?: string | number | null;
  number_of_cylinders?: number | null;
  cylinder_configuration?: string | null;
};

const MANUFACTURER_ALIASES: Record<string, string> = {
  "general motors": "gm",
  gm: "gm",
  chevrolet: "gm",
  chevy: "gm",
  gmc: "gm",
  "ford motor company": "ford",
  ford: "ford",
  "toyota motor corporation": "toyota",
  toyota: "toyota",
  "honda motor co": "honda",
  honda: "honda",
  "volkswagen ag": "vw",
  volkswagen: "vw",
  vw: "vw",
  "bmw ag": "bmw",
  bmw: "bmw",
  "mercedes-benz": "mercedes",
  mercedes: "mercedes",
  "nissan motor co": "nissan",
  nissan: "nissan",
};

export function normalizeText(input: string | null): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .replace(/[\u2019\u2018']/g, "")
    .replace(/[^a-z0-9\s.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalManufacturer(input: string | null): string {
  const key = normalizeText(input);
  return MANUFACTURER_ALIASES[key] ?? key;
}

export function parseDisplacementToLiters(
  input: string | number | null
): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") {
    return input > 10 ? roundLiters(input / 1000) : roundLiters(input);
  }
  const raw = normalizeText(input);
  const ccMatch = raw.match(/(\d+(\.\d+)?)\s*cc/);
  if (ccMatch) return roundLiters(parseFloat(ccMatch[1]) / 1000);

  const lMatch = raw.match(/(\d+(\.\d+)?)\s*l/);
  if (lMatch) return roundLiters(parseFloat(lMatch[1]));

  const num = raw.match(/^\d+(\.\d+)?$/);
  if (num) {
    const val = parseFloat(num[0]);
    return val > 10 ? roundLiters(val / 1000) : roundLiters(val);
  }
  return null;
}

export function roundLiters(value: number): number {
  return Math.round(value * 10) / 10;
}

export function normalizeEngineKey(row: EngineRow): string {
  const m = canonicalManufacturer(row.manufacturer);
  const model = normalizeText(row.model);
  const disp = row.displacement_l ? roundLiters(row.displacement_l) : null;
  const cyl = row.number_of_cylinders ?? null;
  const config = normalizeText(row.cylinder_configuration);
  return [m, model, disp ?? "na", cyl ?? "na", config || "na"].join("|");
}

export function normalizeCandidateToRow(candidate: CandidateInput): EngineRow {
  return {
    manufacturer: candidate.manufacturer ?? null,
    model: candidate.model ?? null,
    displacement_l: parseDisplacementToLiters(candidate.displacement ?? null),
    number_of_cylinders:
      candidate.number_of_cylinders === undefined
        ? null
        : candidate.number_of_cylinders,
    cylinder_configuration: candidate.cylinder_configuration ?? null,
  };
}

export function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const bigrams = (s: string) => {
    const out: string[] = [];
    for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
    return out;
  };
  const aB = bigrams(a);
  const bB = bigrams(b);
  const bSet = new Map<string, number>();
  for (const bg of bB) bSet.set(bg, (bSet.get(bg) ?? 0) + 1);

  let intersection = 0;
  for (const bg of aB) {
    const count = bSet.get(bg) ?? 0;
    if (count > 0) {
      bSet.set(bg, count - 1);
      intersection++;
    }
  }
  return (2 * intersection) / (aB.length + bB.length);
}

export function similarityScore(candidate: EngineRow, existing: EngineRow): number {
  const m1 = canonicalManufacturer(candidate.manufacturer);
  const m2 = canonicalManufacturer(existing.manufacturer);
  const manuScore = m1 && m2 && m1 === m2 ? 1 : 0;

  const modelScore = stringSimilarity(
    normalizeText(candidate.model),
    normalizeText(existing.model)
  );

  const disp1 = candidate.displacement_l ?? null;
  const disp2 = existing.displacement_l ?? null;
  const dispScore =
    disp1 !== null && disp2 !== null && Math.abs(disp1 - disp2) <= 0.1 ? 1 : 0;

  const cylScore =
    candidate.number_of_cylinders !== null &&
    existing.number_of_cylinders !== null &&
    candidate.number_of_cylinders === existing.number_of_cylinders
      ? 1
      : 0;

  return modelScore * 0.6 + manuScore * 0.2 + dispScore * 0.1 + cylScore * 0.1;
}

export function buildEngineIndex(rows: EngineRow[]) {
  const engineIndex = new Map<string, EngineRow>();
  const byManufacturer = new Map<string, EngineRow[]>();

  for (const row of rows) {
    const key = normalizeEngineKey(row);
    if (key) engineIndex.set(key, row);

    const manufacturer = canonicalManufacturer(row.manufacturer);
    if (!byManufacturer.has(manufacturer)) byManufacturer.set(manufacturer, []);
    byManufacturer.get(manufacturer)?.push(row);
  }

  return { engineIndex, byManufacturer };
}

export function findNearDuplicates(
  candidate: EngineRow,
  bucket: EngineRow[],
  threshold = 0.82,
  limit = 3
) {
  const scored = bucket
    .map((row) => ({
      row,
      score: similarityScore(candidate, row),
    }))
    .filter((s) => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}
