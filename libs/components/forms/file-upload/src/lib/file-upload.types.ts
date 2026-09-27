export type DynamoFileUploadPart =
  'root' | 'dropzone' | 'input' | 'fileList' | 'fileItem' | 'removeButton';

/** Reason a file was rejected by `accept`/`maxFileSize`/`maxFiles` validation. */
export type DynamoFileRejectionReason = 'type' | 'size' | 'count';

export interface DynamoFileRejection {
  file: File;
  reason: DynamoFileRejectionReason;
}

/** `'uploading'`'s `progress` (0-100) drives the progress bar; `'error'`'s `error` is shown under the file name. Consumer-driven — DynamoFileUpload never sets these itself, only displays whatever a caller reports back. */
export type DynamoFileUploadStatus = 'uploading' | 'success' | 'error';

export interface DynamoFileUploadProgress {
  status: DynamoFileUploadStatus;
  /** 0-100. Only meaningful while `status` is `'uploading'` — ignored otherwise. */
  progress?: number;
  /** Shown under the file name while `status` is `'error'`. Falls back to a generic message when unset. */
  error?: string;
}
