import {
  createSkippedLine,
  getLineAnomalies,
  parseLogLine,
} from "@/lib/parser/parse-line";
import type { ParseResult, ParseStats } from "@/types/log-analyzer";

function createEmptyStats(totalLines: number): ParseStats {
  return {
    totalLines,
    parsed: 0,
    skipped: 0,
    byFormat: {
      standard: 0,
      json: 0,
    },
    anomalies: {
      alternateTimestamps: 0,
      missingStatus: 0,
      alternateDurationUnits: 0,
    },
  };
}

export function parseLog(content: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const stats = createEmptyStats(lines.length);
  const entries: ParseResult["entries"] = [];
  const skipped: ParseResult["skipped"] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const result = parseLogLine(line, lineNumber);

    if (!result.ok) {
      if (result.reason !== "blank") {
        skipped.push(createSkippedLine(lineNumber, result.reason, line));
        stats.skipped += 1;
      } else {
        stats.skipped += 1;
      }
      return;
    }

    entries.push(result.entry);
    stats.parsed += 1;
    stats.byFormat[result.entry.format] += 1;

    const anomalies = getLineAnomalies(result.entry);
    if (anomalies.alternateTimestamp) {
      stats.anomalies.alternateTimestamps += 1;
    }
    if (anomalies.missingStatus) {
      stats.anomalies.missingStatus += 1;
    }
    if (anomalies.alternateDurationUnit) {
      stats.anomalies.alternateDurationUnits += 1;
    }
  });

  return { entries, skipped, stats };
}
