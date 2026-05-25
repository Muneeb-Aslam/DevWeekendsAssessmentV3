"use server";

import { analyzeLog } from "@/lib/analyzer/analyze";
import { parseLog } from "@/lib/parser/parse-log";
import {
  MAX_LOG_FILE_SIZE_BYTES,
  validateLogFile,
} from "@/lib/validate-log-file";
import type { AnalysisResult } from "@/types/log-analyzer";

export type AnalyzeLogSuccess = {
  success: true;
  data: AnalysisResult;
};

export type AnalyzeLogFailure = {
  success: false;
  error: string;
};

export type AnalyzeLogResponse = AnalyzeLogSuccess | AnalyzeLogFailure;

export async function analyzeLogFile(
  formData: FormData,
): Promise<AnalyzeLogResponse> {
  const file = formData.get("logFile");

  if (!(file instanceof File)) {
    return {
      success: false,
      error: "Please select a file to upload.",
    };
  }

  const validation = validateLogFile(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.message,
    };
  }

  const content = await file.text();

  if (content.length > MAX_LOG_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: "File exceeds the 10MB size limit.",
    };
  }

  if (!content.trim()) {
    return {
      success: false,
      error: "The selected file is empty.",
    };
  }

  const parseResult = parseLog(content);
  const analysis = analyzeLog(file.name, parseResult);

  return {
    success: true,
    data: analysis,
  };
}
