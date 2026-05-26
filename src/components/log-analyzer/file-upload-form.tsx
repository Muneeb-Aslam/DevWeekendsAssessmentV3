"use client";

import { useRef, useState, type ReactElement } from "react";
import { CloudUpload, FileText, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatFileSize,
  formatMaxFileSize,
  validateLogFile,
} from "@/lib/validate-log-file";
import { cn } from "@/lib/utils";

const ACCEPTED_FILE_TYPES = ".log,.txt,.csv,text/plain,text/csv";

type FileUploadFormProps = {
  onAnalyze?: (file: File) => void;
  isLoading?: boolean;
  compact?: boolean;
};

function resetFileInput(input: HTMLInputElement | null): void {
  if (input) {
    input.value = "";
  }
}

export function FileUploadForm({
  onAnalyze,
  isLoading = false,
  compact = false,
}: FileUploadFormProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function processFile(file: File | undefined): void {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const result = validateLogFile(file);

    if (!result.valid) {
      toast.error(result.message);
      setSelectedFile(null);
      resetFileInput(inputRef.current);
      return;
    }

    setSelectedFile(result.file);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    processFile(event.target.files?.[0]);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.stopPropagation();
    if (!isLoading) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (isLoading) return;

    processFile(event.dataTransfer.files?.[0]);
  }

  function handleClearFile(event: React.MouseEvent): void {
    event.stopPropagation();
    setSelectedFile(null);
    resetFileInput(inputRef.current);
  }

  function handleBrowseClick(): void {
    if (!isLoading) {
      inputRef.current?.click();
    }
  }

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();

    const result = validateLogFile(selectedFile);

    if (!result.valid) {
      toast.error(result.message);
      if (result.error !== "no_file") {
        setSelectedFile(null);
        resetFileInput(inputRef.current);
      }
      return;
    }

    onAnalyze?.(result.file);
  }

  const dropZoneClasses = cn(
    "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors",
    compact ? "px-4 py-6" : "px-6 py-8",
    isDragging
      ? "border-primary bg-primary/5"
      : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
    selectedFile && "border-primary/40 bg-primary/5",
    isLoading && "pointer-events-none opacity-60",
  );

  return (
    <Card className={cn("min-w-0", compact && "lg:sticky lg:top-4")}>
      <CardHeader className={cn(compact && "pb-3")}>
        <CardTitle className={compact ? "text-base" : undefined}>
          Upload log file
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          .log, .txt, .csv — max {formatMaxFileSize()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="log-file" className="sr-only">
            Log file
          </label>

          {selectedFile ? (
            <div
              className={cn(
                "rounded-lg border bg-muted/40 p-3",
                compact && "space-y-2",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClearFile}
                  disabled={isLoading}
                  className="h-8 w-8 shrink-0"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {!compact && (
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  className="text-xs text-primary hover:underline"
                >
                  Choose a different file
                </button>
              )}
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleBrowseClick();
                }
              }}
              onClick={handleBrowseClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={dropZoneClasses}
            >
              <div
                className={cn(
                  "mb-2 flex items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border",
                  compact ? "h-10 w-10" : "h-12 w-12",
                  isDragging && "bg-primary/10 ring-primary/30",
                )}
              >
                <CloudUpload
                  className={cn(
                    "text-muted-foreground",
                    compact ? "h-5 w-5" : "h-6 w-6",
                    isDragging && "text-primary",
                  )}
                />
              </div>
              <p className="text-sm font-medium">
                {isDragging ? "Drop file here" : "Drag & drop"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                or click to browse
              </p>
            </div>
          )}

          <input
            ref={inputRef}
            id="log-file"
            type="file"
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileChange}
            disabled={isLoading}
            className="sr-only"
          />

          <Button
            type="submit"
            disabled={!selectedFile || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Analyze log
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
