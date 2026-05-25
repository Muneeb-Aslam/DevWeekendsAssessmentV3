"use client";

import { BarChart3 } from "lucide-react";
import { useState, useTransition, type ReactElement } from "react";
import { toast } from "sonner";

import { analyzeLogFile } from "@/app/actions/analyze-log";
import { AnalysisResults } from "@/components/log-analyzer/analysis-results";
import { FileUploadForm } from "@/components/log-analyzer/file-upload-form";
import type { AnalysisResult } from "@/types/log-analyzer";

function EmptyResultsPanel(): ReactElement {
  return (
    <div className="flex min-h-[320px] min-w-0 flex-col items-center justify-center rounded-xl border border-dashed bg-background/60 p-6 text-center sm:min-h-[420px] sm:p-8">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <BarChart3 className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-base font-semibold">No analysis yet</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Upload a log file to see parsed line counts, error rates, latency stats,
        top endpoints, and slowest requests — all in one view.
      </p>
    </div>
  );
}

export function LogAnalyzerMain(): ReactElement {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpload(file: File): void {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("logFile", file);

      const response = await analyzeLogFile(formData);

      if (!response.success) {
        toast.error(response.error);
        return;
      }

      setAnalysis(response.data);
      toast.success("Log analysis complete");
    });
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-3">
      <div className="min-w-0">
        <FileUploadForm
          onAnalyze={handleUpload}
          isLoading={isPending}
          compact={analysis !== null}
        />
      </div>
      <div className="min-w-0 lg:col-span-2">
        {analysis ? <AnalysisResults data={analysis} /> : <EmptyResultsPanel />}
      </div>
    </div>
  );
}
