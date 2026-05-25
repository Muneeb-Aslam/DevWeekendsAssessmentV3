import { Activity } from "lucide-react";

export function LogAnalyzerHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Log Analyzer</h1>
          <p className="text-sm text-muted-foreground">
            Upload server logs for on-call insights
          </p>
        </div>
      </div>
    </header>
  );
}
