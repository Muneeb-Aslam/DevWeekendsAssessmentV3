#!/usr/bin/env tsx
/**
 * Generates representative log files for local testing.
 *
 * Usage:
 *   pnpm generate-log                              # 06-high-volume.log (5000 lines)
 *   pnpm generate-log:all                          # 07-all-use-cases-mixed.log
 *   pnpm generate-log -- --out path.log --lines N  # custom output
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const HIGH_VOLUME_OUTPUT = "sample-logs/06-high-volume.log";
const ALL_USE_CASES_OUTPUT = "sample-logs/07-all-use-cases-mixed.log";

const HIGH_VOLUME_LINES = 5000;
const ALL_USE_CASES_GENERATED_LINES = 2500;

const IPS = ["192.168.1.42", "10.0.0.7", "172.16.0.22", "203.0.113.10"];
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const PATHS = [
  "/api/health",
  "/api/users",
  "/api/users/12",
  "/api/login",
  "/api/dashboard",
  "/api/orders",
  "/api/products",
  "/api/search",
  "/api/checkout",
  "/api/reports/export",
  "/api/webhooks/stripe",
  "/api/metrics",
  "/api/billing",
  "/api/admin",
  "/api/batch/process",
];
const STATUSES = [200, 201, 204, 401, 403, 404, 500, 502, 504];
const USER_AGENTS = [
  '"Mozilla/5.0 (Windows NT 10.0)"',
  '"curl/8.5.0"',
  '"kube-probe/1.29"',
  '"Mozilla/5.0 (Macintosh; Intel Mac OS X)" "https://app.example.com/"',
];

type TimestampFormat = "iso" | "slash" | "dayMonth" | "unix";
type Preset = "high-volume" | "all-use-cases" | "custom";

const CURATED_EDGE_CASES: string[] = [
  "2024-03-15T14:23:01Z 192.168.1.42 GET /api/users 200 142ms",
  "2024/03/15 14:23:02 10.0.0.7 POST /api/login 401 89ms",
  "15-Mar-2024 14:23:03 172.16.0.22 GET /api/users/12 200 53ms",
  "1710512581 192.168.1.42 GET /api/health 200 14ms",
  "  2024-03-15T14:23:04Z 192.168.1.42 GET /api/ping 200 11ms",
  "2024-03-15T14:23:05Z 10.0.0.7 GET /api/subsecond 200 0.142s",
  "2024-03-15T14:23:06Z 172.16.0.22 GET /api/bare-ms 200 142",
  "2024-03-15T14:23:07Z 192.168.1.42 POST /api/login - 76ms",
  "2024-03-15T14:23:08Z 10.0.0.7 GET /api/users 200 98ms \"Mozilla/5.0 (Windows NT 10.0)\" \"https://app.example.com/dashboard\"",
  '{"timestamp":"2024-03-15T14:23:09Z","method":"GET","path":"/api/json","status":200,"duration_ms":33,"ip":"10.0.0.7"}',
  '{"timestamp":"2024-03-15T14:23:10Z","http_method":"POST","url":"/api/orders","status_code":201,"response_time_ms":210}',
  "2024-03-15T14:23:11Z 192.168.1.42 GET /api/admin 403 41ms",
  "2024-03-15T14:23:12Z 10.0.0.7 POST /api/batch/process 504 2.104s",
  "2024-03-15T14:23:13Z 172.16.0.22 GET /api/reports/export 200 2847",
  "2024-03-15T14:23:14Z 192.168.1.42 GET /api/prod",
  "192.168.1.42 GET /api/broken 200 142ms",
  "totally malformed line !!!",
  "PARTIAL: 2024-03-15T16:00:18Z 172.16.",
  'Exception in thread "main" java.lang.RuntimeException: upstream timeout',
  "\tat com.example.ApiGateway.route(ApiGateway.java:142)",
  "Caused by: java.net.SocketTimeoutException: Read timed out",
  '{"timestamp":"2024-03-15T16:00:20Z","method":"GET","path":"/api/metrics"',
  "DEBUG [main] org.example.Service - not an access log line",
  "2024-03-15T14:23:15Z 10.0.0.7 HEAD /api/health 200 8ms",
  "2024-03-15T14:23:16Z 172.16.0.22 OPTIONS /api/users 204 5ms",
];

type GenerateOptions = {
  output: string;
  lines: number;
  preset: Preset;
};

function parseArgs(): GenerateOptions {
  const args = process.argv.slice(2);
  let output = HIGH_VOLUME_OUTPUT;
  let lines = HIGH_VOLUME_LINES;
  let preset: Preset = "high-volume";

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--out" && args[index + 1]) {
      output = args[index + 1];
      preset = "custom";
      index += 1;
    } else if (args[index] === "--lines" && args[index + 1]) {
      lines = Number(args[index + 1]);
      index += 1;
    } else if (args[index] === "--preset" && args[index + 1]) {
      const value = args[index + 1];
      if (value === "high-volume" || value === "all-use-cases") {
        preset = value;
      }
      index += 1;
    } else if (args[index] === "--all-use-cases") {
      preset = "all-use-cases";
    }
  }

  if (preset === "all-use-cases") {
    output = ALL_USE_CASES_OUTPUT;
    lines = ALL_USE_CASES_GENERATED_LINES;
  } else if (preset === "high-volume" && !args.includes("--out")) {
    output = HIGH_VOLUME_OUTPUT;
    lines = args.includes("--lines") ? lines : HIGH_VOLUME_LINES;
  }

  return { output, lines, preset };
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatIso(base: Date, offsetSeconds: number): string {
  const date = new Date(base.getTime() + offsetSeconds * 1000);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}Z`;
}

function formatSlash(base: Date, offsetSeconds: number): string {
  const date = new Date(base.getTime() + offsetSeconds * 1000);
  return `${date.getUTCFullYear()}/${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function formatDayMonth(base: Date, offsetSeconds: number): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const date = new Date(base.getTime() + offsetSeconds * 1000);
  return `${date.getUTCDate()}-${months[date.getUTCMonth()]}-${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function formatTimestamp(
  format: TimestampFormat,
  base: Date,
  offsetSeconds: number,
): string {
  if (format === "iso") return formatIso(base, offsetSeconds);
  if (format === "slash") return formatSlash(base, offsetSeconds);
  if (format === "dayMonth") return formatDayMonth(base, offsetSeconds);
  return String(Math.floor(base.getTime() / 1000) + offsetSeconds);
}

function formatDuration(milliseconds: number): string {
  const roll = Math.random();
  if (roll < 0.55) return `${milliseconds}ms`;
  if (roll < 0.8) return `${(milliseconds / 1000).toFixed(3)}s`;
  return String(milliseconds);
}

function formatStatus(status: number): string {
  if (Math.random() < 0.06) return "-";
  return String(status);
}

function buildStandardLine(base: Date, index: number): string {
  const timestamp = formatTimestamp(
    pick(["iso", "slash", "dayMonth", "unix"] as TimestampFormat[]),
    base,
    index,
  );
  const ip = pick(IPS);
  const method = pick(METHODS);
  const path = pick(PATHS);
  const status = pick(STATUSES);
  const durationMs = Math.floor(Math.random() * 3000) + 5;
  const duration = formatDuration(durationMs);
  const statusText = formatStatus(status);

  let line = `${timestamp} ${ip} ${method} ${path} ${statusText} ${duration}`;

  if (Math.random() < 0.12) {
    line += ` ${pick(USER_AGENTS)}`;
  }

  if (Math.random() < 0.05) {
    line = `  ${line}`;
  }

  return line;
}

function buildJsonLine(base: Date, index: number): string {
  const roll = Math.random();
  const timestamp = formatIso(base, index);

  if (roll < 0.5) {
    return JSON.stringify({
      timestamp,
      method: pick(METHODS),
      path: pick(PATHS),
      status: pick(STATUSES),
      duration_ms: Math.floor(Math.random() * 3000) + 5,
      ip: pick(IPS),
    });
  }

  return JSON.stringify({
    time: timestamp,
    http_method: pick(METHODS),
    url: pick(PATHS),
    status_code: pick(STATUSES),
    response_time_ms: Math.floor(Math.random() * 3000) + 5,
    client_ip: pick(IPS),
  });
}

function buildNoiseLine(index: number): string {
  const noise = [
    "",
    "",
    "Exception in thread \"worker\" java.lang.RuntimeException: boom",
    "\tat com.example.Service.run(Service.java:42)",
    "Caused by: java.io.IOException: broken pipe",
    "\t... 8 more",
    "totally malformed !!!",
    `PARTIAL: 2024-03-15T16:${pad(index % 60)}`,
    "DEBUG not an access log",
    `{"timestamp":"2024-03-15T12:00:${pad(index % 60)}Z","method":"GET"`,
    "nginx: [error] upstream prematurely closed connection",
    `2024-03-15T16:00:${pad(index % 60)}Z 10.0.0.7 GET /api/truncated`,
  ];
  return pick(noise);
}

function generateMixedLines(count: number, startIndex = 1): string[] {
  const base = new Date("2024-03-15T00:00:00Z");
  const lines: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const lineIndex = startIndex + index;
    const roll = Math.random();

    if (roll < 0.08) {
      lines.push(buildNoiseLine(lineIndex));
      continue;
    }

    if (roll < 0.18) {
      lines.push(buildJsonLine(base, lineIndex));
      continue;
    }

    lines.push(buildStandardLine(base, lineIndex));
  }

  return lines;
}

function generateAllUseCasesLines(generatedCount: number): string[] {
  return [
    ...CURATED_EDGE_CASES,
    "",
    ...generateMixedLines(generatedCount, CURATED_EDGE_CASES.length + 1),
  ];
}

function writeLogFile(output: string, lines: string[]): void {
  const absoluteOutput = resolve(output);
  mkdirSync(dirname(absoluteOutput), { recursive: true });
  writeFileSync(absoluteOutput, `${lines.join("\n")}\n`, "utf8");
  console.log(`Generated ${lines.length} lines -> ${absoluteOutput}`);
}

function main(): void {
  const { output, lines, preset } = parseArgs();

  if (preset === "all-use-cases") {
    writeLogFile(output, generateAllUseCasesLines(lines));
    return;
  }

  writeLogFile(output, generateMixedLines(lines));
}

main();
