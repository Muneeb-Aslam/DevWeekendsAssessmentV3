import { Activity } from "lucide-react";
import type { ReactElement } from "react";

export function LogAnalyzerHeader(): ReactElement {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight">
            Log Analyzer
          </h1>
          <p className="text-xs text-muted-foreground">
            Upload server logs for on-call insights
          </p>
        </div>
      </div>
    </header>
  );
}
