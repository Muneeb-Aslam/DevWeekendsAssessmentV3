export const MAX_LOG_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_EXTENSIONS = [".log", ".txt", ".json", ".csv"] as const;

export const ALLOWED_MIME_TYPES = [
  "text/plain",
  "application/json",
  "text/csv",
  "application/csv",
  "text/x-log",
] as const;

export type FileValidationError =
  | "no_file"
  | "unsupported_type"
  | "size_exceeded"
  | "empty_file";

export type FileValidationResult =
  | { valid: true; file: File }
  | { valid: false; error: FileValidationError; message: string };

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0) return "";
  return filename.slice(lastDot).toLowerCase();
}

function isAllowedExtension(filename: string): boolean {
  const extension = getExtension(filename);
  return ALLOWED_EXTENSIONS.some((allowed) => allowed === extension);
}

function isAllowedMimeType(mimeType: string): boolean {
  if (!mimeType) return false;
  return ALLOWED_MIME_TYPES.some((allowed) => allowed === mimeType);
}

export function formatMaxFileSize(): string {
  return `${MAX_LOG_FILE_SIZE_BYTES / (1024 * 1024)}MB`;
}

export function validateLogFile(
  file: File | null | undefined,
): FileValidationResult {
  if (!file) {
    return {
      valid: false,
      error: "no_file",
      message: "Please select a file to upload.",
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "empty_file",
      message: "The selected file is empty.",
    };
  }

  if (file.size > MAX_LOG_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "size_exceeded",
      message: `File exceeds the ${formatMaxFileSize()} size limit.`,
    };
  }

  const extensionAllowed = isAllowedExtension(file.name);
  const mimeAllowed = isAllowedMimeType(file.type);

  if (!extensionAllowed && !mimeAllowed) {
    return {
      valid: false,
      error: "unsupported_type",
      message: "Unsupported file type. Use .log, .txt, .json, or .csv files.",
    };
  }

  return { valid: true, file };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
