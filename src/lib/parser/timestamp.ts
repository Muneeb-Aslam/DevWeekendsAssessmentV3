import type { TimestampFormat } from "@/types/log-analyzer";

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

type TimestampMatch = {
  raw: string;
  format: TimestampFormat;
};

const TIMESTAMP_PATTERNS: Array<{
  format: TimestampFormat;
  pattern: RegExp;
}> = [
  {
    format: "iso",
    pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/,
  },
  {
    format: "slash",
    pattern: /^\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}/,
  },
  {
    format: "day-month-year",
    pattern: /^\d{1,2}-[A-Za-z]{3}-\d{4}\s+\d{2}:\d{2}:\d{2}/,
  },
  {
    format: "unix",
    pattern: /^\d{10,13}/,
  },
];

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function toIsoString(date: Date): string | null {
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function parseDayMonthYear(raw: string): Date | null {
  const match = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/.exec(
    raw,
  );
  if (!match) {
    return null;
  }

  const month = MONTHS[match[2].toLowerCase()];
  if (month === undefined) {
    return null;
  }

  return new Date(
    Number(match[3]),
    month,
    Number(match[1]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
  );
}

function parseSlashDate(raw: string): Date | null {
  const match = /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/.exec(raw);
  if (!match) {
    return null;
  }

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
  );
}

function parseUnixEpoch(raw: string): Date | null {
  const digits = raw.length === 13 ? Number(raw) : Number(raw) * 1000;
  return new Date(digits);
}

function normalizeTimestamp(
  raw: string,
  format: TimestampFormat,
): string | null {
  if (format === "iso") {
    const normalized = raw.endsWith("Z") ? raw : `${raw}Z`;
    return toIsoString(new Date(normalized));
  }

  if (format === "slash") {
    return toIsoString(parseSlashDate(raw) ?? new Date(Number.NaN));
  }

  if (format === "day-month-year") {
    return toIsoString(parseDayMonthYear(raw) ?? new Date(Number.NaN));
  }

  if (format === "unix") {
    return toIsoString(parseUnixEpoch(raw) ?? new Date(Number.NaN));
  }

  return toIsoString(new Date(raw));
}

export function extractTimestamp(line: string): TimestampMatch | null {
  for (const { format, pattern } of TIMESTAMP_PATTERNS) {
    const match = pattern.exec(line);
    if (match) {
      return { raw: match[0], format };
    }
  }
  return null;
}

export function parseTimestamp(
  raw: string,
  format: TimestampFormat,
): string | null {
  return normalizeTimestamp(raw, format);
}

export function parseFlexibleTimestamp(value: unknown): {
  iso: string | null;
  format: TimestampFormat;
} | null {
  if (typeof value === "number") {
    const iso = toIsoString(parseUnixEpoch(String(value)) ?? new Date(Number.NaN));
    return iso ? { iso, format: "unix" } : null;
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const trimmed = value.trim();
  const extracted = extractTimestamp(trimmed);
  if (!extracted) {
    const iso = toIsoString(new Date(trimmed));
    return iso ? { iso, format: "json" } : null;
  }

  const iso = parseTimestamp(extracted.raw, extracted.format);
  return iso ? { iso, format: extracted.format } : null;
}

export function formatTimestampLabel(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleString();
}

export { pad };
