import type { DynamoSeverity } from '@dynamong/core/api';

export interface DynamoConfirmOptions {
  message: string;
  title?: string;
  /** Defaults to `'Confirm'`. */
  confirmLabel?: string;
  /** Defaults to `'Cancel'`. */
  cancelLabel?: string;
  /** Forwarded to the confirm button's `severity`. Defaults to `'primary'`; use `'danger'` for destructive actions. */
  severity?: DynamoSeverity;
  /** Defaults to `true`. */
  closeOnBackdropClick?: boolean;
  /** Defaults to `true`. */
  closeOnEscape?: boolean;
}

/** Fully-resolved options for a request that's been queued/presented. */
export interface DynamoConfirmEntry {
  message: string;
  title: string | undefined;
  confirmLabel: string;
  cancelLabel: string;
  severity: DynamoSeverity;
  closeOnBackdropClick: boolean;
  closeOnEscape: boolean;
}
