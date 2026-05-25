export type DurationParseResult = {
  milliseconds: number | null;
  unit: "ms" | "s" | "bare" | "unknown";
};

export function parseDuration(raw: string): DurationParseResult {
  const trimmed = raw.trim().toLowerCase();

  if (!trimmed || trimmed === "-") {
    return { milliseconds: null, unit: "unknown" };
  }

  const millisecondsMatch = /^(\d+(?:\.\d+)?)ms$/.exec(trimmed);
  if (millisecondsMatch) {
    return {
      milliseconds: Math.round(Number(millisecondsMatch[1])),
      unit: "ms",
    };
  }

  const secondsMatch = /^(\d+(?:\.\d+)?)s$/.exec(trimmed);
  if (secondsMatch) {
    return {
      milliseconds: Math.round(Number(secondsMatch[1]) * 1000),
      unit: "s",
    };
  }

  if (/^\d+(?:\.\d+)?$/.exec(trimmed)) {
    return {
      milliseconds: Math.round(Number(trimmed)),
      unit: "bare",
    };
  }

  return { milliseconds: null, unit: "unknown" };
}

export function parseDurationValue(value: unknown): DurationParseResult {
  if (typeof value === "number") {
    return { milliseconds: Math.round(value), unit: "bare" };
  }

  if (typeof value === "string") {
    return parseDuration(value);
  }

  return { milliseconds: null, unit: "unknown" };
}
