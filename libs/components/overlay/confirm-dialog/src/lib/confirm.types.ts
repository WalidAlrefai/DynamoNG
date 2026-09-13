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
  /** Hides the cancel button, for an "OK"-only informational prompt with no real decision to make. Defaults to `true`. */
  showCancel?: boolean;
  /** Which button receives focus once the dialog opens. Defaults to `'none'` (the panel itself is focused, matching a plain alert dialog — neither button is pre-armed for Enter/Space). */
  defaultFocus?: 'confirm' | 'cancel' | 'none';
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
  showCancel: boolean;
  defaultFocus: 'confirm' | 'cancel' | 'none';
}
