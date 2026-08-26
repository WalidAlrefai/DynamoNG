export type DynamoFileUploadPart =
  | 'root'
  | 'dropzone'
  | 'input'
  | 'fileList'
  | 'fileItem'
  | 'removeButton';

/** Reason a file was rejected by `accept`/`maxFileSize`/`maxFiles` validation. */
export type DynamoFileRejectionReason = 'type' | 'size' | 'count';

export interface DynamoFileRejection {
  file: File;
  reason: DynamoFileRejectionReason;
}
