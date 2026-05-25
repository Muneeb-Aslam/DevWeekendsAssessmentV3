import { LogAnalyzerHeader } from "@/components/log-analyzer/header";
import { LogAnalyzerMain } from "@/components/log-analyzer/log-analyzer-main";

export default function Home() {
  return (
    <>
      <LogAnalyzerHeader />
      <main className="flex-1 bg-muted/20">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <LogAnalyzerMain />
        </div>
      </main>
    </>
  );
}
