import type { ReactElement } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTimestampLabel } from "@/lib/parser/timestamp";
import type { AnalysisResult } from "@/types/log-analyzer";

type AnalysisResultsProps = {
  data: AnalysisResult;
};

type SummaryCardConfig = {
  key: string;
  title: string;
  icon: typeof FileText;
  getValue: (data: AnalysisResult) => string;
  getSubtext: (data: AnalysisResult) => string;
};

const SUMMARY_CARDS: SummaryCardConfig[] = [
  {
    key: "parsed",
    title: "Parsed",
    icon: FileText,
    getValue: (data) => data.overview.parsed.toLocaleString(),
    getSubtext: (data) =>
      `${data.overview.parseRate}% of ${data.overview.totalLines.toLocaleString()}`,
  },
  {
    key: "success",
    title: "Success",
    icon: CheckCircle2,
    getValue: (data) => data.status.success.toLocaleString(),
    getSubtext: (data) => {
      if (data.overview.parsed === 0) return "2xx responses";
      return `${((data.status.success / data.overview.parsed) * 100).toFixed(1)}% 2xx`;
    },
  },
  {
    key: "errors",
    title: "Errors",
    icon: XCircle,
    getValue: (data) =>
      (data.status.clientErrors + data.status.serverErrors).toLocaleString(),
    getSubtext: (data) =>
      `${data.status.clientErrors} client · ${data.status.serverErrors} server`,
  },
  {
    key: "skipped",
    title: "Skipped",
    icon: AlertTriangle,
    getValue: (data) => data.overview.skipped.toLocaleString(),
    getSubtext: () => "Malformed lines",
  },
  {
    key: "range",
    title: "Time range",
    icon: Clock,
    getValue: (data) => (data.overview.timeRange.start ? "Detected" : "N/A"),
    getSubtext: (data) => {
      if (!data.overview.timeRange.start || !data.overview.timeRange.end) {
        return "No timestamps";
      }
      return `${formatTimestampLabel(data.overview.timeRange.start)} – ${formatTimestampLabel(data.overview.timeRange.end)}`;
    },
  },
];

function formatResponseTime(milliseconds: number | null): string {
  if (milliseconds === null) return "—";
  if (milliseconds >= 1000) return `${(milliseconds / 1000).toFixed(2)}s`;
  return `${milliseconds}ms`;
}

export function AnalysisResults({ data }: AnalysisResultsProps): ReactElement {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex min-w-0 max-w-full items-center gap-2">
          <h2 className="shrink-0 text-sm font-semibold">Analysis results</h2>
          <span
            className="min-w-0 max-w-full truncate rounded-md bg-secondary px-2 py-0.5 text-xs font-medium"
            title={data.fileName}
          >
            {data.fileName}
          </span>
        </div>
        {data.skippedReasons.length > 0 && (
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {data.skippedReasons.map((item) => (
              <span
                key={item.reason}
                className="rounded-md border bg-background px-2 py-0.5 text-xs text-muted-foreground"
              >
                {item.reason}: {item.count}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9.5rem),1fr))] gap-2">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key} className="min-w-0 shadow-none">
              <CardContent className="p-3">
                <div className="mb-1 flex items-center justify-between gap-1">
                  <span className="truncate text-[11px] font-medium text-muted-foreground">
                    {card.title}
                  </span>
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </div>
                <div className="text-xl font-bold leading-none">
                  {card.getValue(data)}
                </div>
                <p
                  className="mt-1 truncate text-[11px] text-muted-foreground"
                  title={card.getSubtext(data)}
                >
                  {card.getSubtext(data)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid min-w-0 gap-3 lg:grid-cols-2">
        <Card className="flex min-w-0 flex-col overflow-hidden shadow-none">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm">Top endpoints</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 px-4 pb-4 pt-0">
            {data.topEndpoints.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No endpoints found.
              </p>
            ) : (
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8">Path</TableHead>
                      <TableHead className="h-8 text-right">Req</TableHead>
                      <TableHead className="h-8 text-right">Avg</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topEndpoints.map((endpoint) => (
                      <TableRow key={endpoint.path}>
                        <TableCell className="max-w-[180px] truncate py-2 font-mono text-xs">
                          {endpoint.path}
                        </TableCell>
                        <TableCell className="py-2 text-right text-sm">
                          {endpoint.count.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-2 text-right text-sm">
                          {endpoint.avgMs}ms
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex min-w-0 flex-col overflow-hidden shadow-none">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm">Slowest requests</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 px-4 pb-4 pt-0">
            {data.slowestRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No response times found.
              </p>
            ) : (
              <div className="max-w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8">Path</TableHead>
                      <TableHead className="h-8">Status</TableHead>
                      <TableHead className="h-8 text-right">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slowestRequests.map((entry) => (
                      <TableRow key={`${entry.lineNumber}-${entry.path}`}>
                        <TableCell className="max-w-[180px] truncate py-2 font-mono text-xs">
                          {entry.path}
                        </TableCell>
                        <TableCell className="py-2 text-sm">
                          {entry.status ?? "—"}
                        </TableCell>
                        <TableCell className="py-2 text-right text-sm">
                          {formatResponseTime(entry.responseTimeMs)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
