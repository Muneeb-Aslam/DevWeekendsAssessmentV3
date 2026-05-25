import { parseDuration, parseDurationValue } from "@/lib/parser/duration";
import {
  extractTimestamp,
  parseFlexibleTimestamp,
  parseTimestamp,
} from "@/lib/parser/timestamp";
import type {
  LogEntry,
  SkippedLine,
  SkippedReason,
  TimestampFormat,
} from "@/types/log-analyzer";

const HTTP_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);

const STACK_TRACE_PATTERN =
  /^(?:\s+at\s+|Caused by:|Exception in thread|\t|\.\.\.\s+\d+\s+more)/;

type LineParseSuccess = {
  ok: true;
  entry: LogEntry;
};

type LineParseFailure = {
  ok: false;
  reason: SkippedReason;
};

export type LineParseResult = LineParseSuccess | LineParseFailure;

function parseStatus(raw: string): number | null {
  if (!raw || raw === "-") {
    return null;
  }
  const status = Number(raw);
  return Number.isInteger(status) ? status : null;
}

function isStackTraceLine(line: string): boolean {
  return STACK_TRACE_PATTERN.test(line);
}

function readJsonString(
  record: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readJsonNumber(
  record: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

function parseJsonLine(line: string, lineNumber: number): LineParseResult {
  try {
    const parsed = JSON.parse(line) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, reason: "json_parse_error" };
    }

    const record = parsed as Record<string, unknown>;
    const method = readJsonString(record, ["method", "http_method", "verb"]);
    const path = readJsonString(record, ["path", "url", "uri", "endpoint"]);

    if (!method || !path) {
      return { ok: false, reason: "json_parse_error" };
    }

    const timestampValue =
      record.timestamp ?? record.time ?? record["@timestamp"] ?? record.date;
    const timestampParsed = parseFlexibleTimestamp(timestampValue);
    const durationParsed = parseDurationValue(
      record.duration_ms ??
        record.responseTimeMs ??
        record.response_time_ms ??
        record.duration ??
        record.latency,
    );

    return {
      ok: true,
      entry: {
        lineNumber,
        timestamp: timestampParsed?.iso ?? null,
        timestampFormat: timestampParsed?.format ?? "json",
        ip:
          readJsonString(record, ["ip", "client_ip", "remote_addr"]) ?? null,
        method: method.toUpperCase(),
        path,
        status: readJsonNumber(record, ["status", "status_code", "code"]),
        responseTimeMs: durationParsed.milliseconds,
        durationUnit: durationParsed.unit,
        format: "json",
      },
    };
  } catch {
    return { ok: false, reason: "json_parse_error" };
  }
}

function parseStandardTokens(
  remainder: string,
  lineNumber: number,
  timestamp: string | null,
  timestampFormat: TimestampFormat,
): LineParseResult {
  const tokens = remainder.split(/\s+/);
  if (tokens.length < 5) {
    return { ok: false, reason: "unrecognized" };
  }

  const [ip, methodRaw, path, statusRaw, durationRaw] = tokens;
  const method = methodRaw.toUpperCase();

  if (!HTTP_METHODS.has(method) || !path.startsWith("/")) {
    return { ok: false, reason: "unrecognized" };
  }

  const duration = parseDuration(durationRaw);

  return {
    ok: true,
    entry: {
      lineNumber,
      timestamp,
      timestampFormat,
      ip,
      method,
      path,
      status: parseStatus(statusRaw),
      responseTimeMs: duration.milliseconds,
      durationUnit: duration.unit,
      format: "standard",
    },
  };
}

function parseStandardLine(line: string, lineNumber: number): LineParseResult {
  const timestampMatch = extractTimestamp(line);
  if (!timestampMatch) {
    return { ok: false, reason: "unrecognized" };
  }

  const timestamp = parseTimestamp(timestampMatch.raw, timestampMatch.format);
  const remainder = line.slice(timestampMatch.raw.length).trim();

  return parseStandardTokens(
    remainder,
    lineNumber,
    timestamp,
    timestampMatch.format,
  );
}

export function parseLogLine(line: string, lineNumber: number): LineParseResult {
  const trimmed = line.trim();

  if (!trimmed) {
    return { ok: false, reason: "blank" };
  }

  if (isStackTraceLine(trimmed)) {
    return { ok: false, reason: "stack_trace" };
  }

  if (trimmed.startsWith("{")) {
    return parseJsonLine(trimmed, lineNumber);
  }

  return parseStandardLine(trimmed, lineNumber);
}

export function createSkippedLine(
  lineNumber: number,
  reason: SkippedReason,
  content: string,
): SkippedLine {
  return { lineNumber, reason, content: content.slice(0, 200) };
}

export function getLineAnomalies(entry: LogEntry): {
  alternateTimestamp: boolean;
  missingStatus: boolean;
  alternateDurationUnit: boolean;
} {
  return {
    alternateTimestamp:
      entry.timestampFormat !== null && entry.timestampFormat !== "iso",
    missingStatus: entry.status === null,
    alternateDurationUnit:
      entry.durationUnit === "s" || entry.durationUnit === "bare",
  };
}
