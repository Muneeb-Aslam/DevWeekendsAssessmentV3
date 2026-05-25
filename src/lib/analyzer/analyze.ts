import type {
  AnalysisResult,
  EndpointStat,
  LogEntry,
  ParseResult,
  SkippedReason,
  SkippedReasonCount,
} from "@/types/log-analyzer";

const TOP_ENDPOINT_LIMIT = 5;
const TOP_SLOWEST_LIMIT = 5;

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function countStatusCodes(entries: LogEntry[]): AnalysisResult["status"] {
  return entries.reduce(
    (counts, entry) => {
      if (entry.status === null) {
        counts.unknown += 1;
        return counts;
      }
      if (entry.status >= 500) {
        counts.serverErrors += 1;
        return counts;
      }
      if (entry.status >= 400) {
        counts.clientErrors += 1;
        return counts;
      }
      if (entry.status >= 200 && entry.status < 300) {
        counts.success += 1;
        return counts;
      }
      counts.unknown += 1;
      return counts;
    },
    { success: 0, clientErrors: 0, serverErrors: 0, unknown: 0 },
  );
}

function calculateSpeedMetrics(
  responseTimes: number[],
): AnalysisResult["speed"] {
  if (responseTimes.length === 0) {
    return {
      avgMs: 0,
      p50Ms: 0,
      p95Ms: 0,
      fastestMs: 0,
      slowestMs: 0,
    };
  }

  const total = responseTimes.reduce((sum, value) => sum + value, 0);

  return {
    avgMs: Math.round(total / responseTimes.length),
    p50Ms: calculatePercentile(responseTimes, 50),
    p95Ms: calculatePercentile(responseTimes, 95),
    fastestMs: Math.min(...responseTimes),
    slowestMs: Math.max(...responseTimes),
  };
}

function getTimeRange(entries: LogEntry[]): {
  start: string | null;
  end: string | null;
} {
  const timestamps = entries
    .map((entry) => entry.timestamp)
    .filter((value): value is string => value !== null)
    .sort();

  if (timestamps.length === 0) {
    return { start: null, end: null };
  }

  return {
    start: timestamps[0],
    end: timestamps[timestamps.length - 1],
  };
}

function countSkippedReasons(
  skipped: ParseResult["skipped"],
): SkippedReasonCount[] {
  const counts = new Map<SkippedReason, number>();

  skipped.forEach((line) => {
    counts.set(line.reason, (counts.get(line.reason) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((left, right) => right.count - left.count);
}

function getTopEndpoints(entries: LogEntry[]): EndpointStat[] {
  const endpointMap = new Map<string, { count: number; totalMs: number }>();

  entries.forEach((entry) => {
    const current = endpointMap.get(entry.path) ?? { count: 0, totalMs: 0 };
    current.count += 1;
    if (entry.responseTimeMs !== null) {
      current.totalMs += entry.responseTimeMs;
    }
    endpointMap.set(entry.path, current);
  });

  return Array.from(endpointMap.entries())
    .map(([path, value]) => ({
      path,
      count: value.count,
      avgMs: value.count > 0 ? Math.round(value.totalMs / value.count) : 0,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, TOP_ENDPOINT_LIMIT);
}

function getSlowestRequests(entries: LogEntry[]): LogEntry[] {
  return [...entries]
    .filter((entry) => entry.responseTimeMs !== null)
    .sort(
      (left, right) =>
        (right.responseTimeMs ?? 0) - (left.responseTimeMs ?? 0),
    )
    .slice(0, TOP_SLOWEST_LIMIT);
}

export function analyzeLog(
  fileName: string,
  parseResult: ParseResult,
): AnalysisResult {
  const { entries, skipped, stats } = parseResult;
  const responseTimes = entries
    .map((entry) => entry.responseTimeMs)
    .filter((value): value is number => value !== null);
  const parseRate =
    stats.totalLines === 0
      ? 0
      : Number(((stats.parsed / stats.totalLines) * 100).toFixed(1));

  return {
    fileName,
    overview: {
      totalLines: stats.totalLines,
      parsed: stats.parsed,
      skipped: stats.skipped,
      parseRate,
      timeRange: getTimeRange(entries),
    },
    status: countStatusCodes(entries),
    speed: calculateSpeedMetrics(responseTimes),
    slowestRequests: getSlowestRequests(entries),
    topEndpoints: getTopEndpoints(entries),
    skippedReasons: countSkippedReasons(skipped),
    anomalies: stats.anomalies,
  };
}
