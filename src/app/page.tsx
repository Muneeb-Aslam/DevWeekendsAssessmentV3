import { LogAnalyzerHeader } from "@/components/log-analyzer/header";
import { LogAnalyzerMain } from "@/components/log-analyzer/log-analyzer-main";

export default function Home() {
  return (
    <>
      <LogAnalyzerHeader />
      <main className="w-full min-w-0 overflow-x-clip bg-muted/20 px-4 py-4 sm:px-6 lg:px-8">
        <LogAnalyzerMain />
      </main>
    </>
  );
}
