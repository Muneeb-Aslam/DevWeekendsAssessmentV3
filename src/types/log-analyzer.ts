export type LogFormat = "standard" | "json";

export type TimestampFormat =
  | "iso"
  | "slash"
  | "day-month-year"
  | "unix"
  | "json";

export type LogEntry = {
  lineNumber: number;
  timestamp: string | null;
  timestampFormat: TimestampFormat | null;
  ip: string | null;
  method: string;
  path: string;
  status: number | null;
  responseTimeMs: number | null;
  durationUnit: "ms" | "s" | "bare" | "unknown" | null;
  format: LogFormat;
};

export type SkippedReason =
  | "blank"
  | "unrecognized"
  | "json_parse_error"
  | "stack_trace";

export type SkippedLine = {
  lineNumber: number;
  reason: SkippedReason;
  content: string;
};

export type ParseStats = {
  totalLines: number;
  parsed: number;
  skipped: number;
  byFormat: {
    standard: number;
    json: number;
  };
  anomalies: {
    alternateTimestamps: number;
    missingStatus: number;
    alternateDurationUnits: number;
  };
};

export type ParseResult = {
  entries: LogEntry[];
  skipped: SkippedLine[];
  stats: ParseStats;
};

export type EndpointStat = {
  path: string;
  count: number;
  avgMs: number;
};

export type SkippedReasonCount = {
  reason: SkippedReason;
  count: number;
};

export type AnalysisResult = {
  fileName: string;
  overview: {
    totalLines: number;
    parsed: number;
    skipped: number;
    parseRate: number;
    timeRange: {
      start: string | null;
      end: string | null;
    };
  };
  status: {
    success: number;
    clientErrors: number;
    serverErrors: number;
    unknown: number;
  };
  speed: {
    avgMs: number;
    p50Ms: number;
    p95Ms: number;
    fastestMs: number;
    slowestMs: number;
  };
  slowestRequests: LogEntry[];
  topEndpoints: EndpointStat[];
  skippedReasons: SkippedReasonCount[];
  anomalies: ParseStats["anomalies"];
};
