"use client";

import { useRef, useState } from "react";
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

const ACCEPTED_FILE_TYPES =
  ".log,.txt,.json,.csv,text/plain,application/json,text/csv";

type FileUploadFormProps = {
  onAnalyze?: (file: File) => void;
  isLoading?: boolean;
};

function resetFileInput(input: HTMLInputElement | null) {
  if (input) {
    input.value = "";
  }
}

export function FileUploadForm({
  onAnalyze,
  isLoading = false,
}: FileUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function processFile(file: File | undefined) {
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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    processFile(event.target.files?.[0]);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!isLoading) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    if (isLoading) return;

    const file = event.dataTransfer.files?.[0];
    processFile(file);
  }

  function handleClearFile(event: React.MouseEvent) {
    event.stopPropagation();
    setSelectedFile(null);
    resetFileInput(inputRef.current);
  }

  function handleBrowseClick() {
    if (!isLoading) {
      inputRef.current?.click();
    }
  }

  function handleSubmit(event: React.FormEvent) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload log file</CardTitle>
        <CardDescription>
          Drag and drop or browse for .log, .txt, .json, and .csv files up to{" "}
          {formatMaxFileSize()}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            className={cn(
              "relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
              selectedFile && "border-primary/40 bg-primary/5",
              isLoading && "pointer-events-none opacity-60",
            )}
          >
            <input
              ref={inputRef}
              id="log-file"
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileChange}
              disabled={isLoading}
              className="sr-only"
            />

            {selectedFile ? (
              <div className="flex w-full max-w-md flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFile}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  Remove file
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border transition-colors",
                    isDragging && "bg-primary/10 ring-primary/30",
                  )}
                >
                  <CloudUpload
                    className={cn(
                      "h-7 w-7 text-muted-foreground transition-colors",
                      isDragging && "text-primary",
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {isDragging
                      ? "Drop your log file here"
                      : "Drag and drop your log file here"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or{" "}
                    <span className="font-medium text-primary underline-offset-4 hover:underline">
                      browse
                    </span>{" "}
                    to choose a file
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  .log, .txt, .json, .csv — max {formatMaxFileSize()}
                </p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={!selectedFile || isLoading}
            className="w-full sm:w-auto"
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
