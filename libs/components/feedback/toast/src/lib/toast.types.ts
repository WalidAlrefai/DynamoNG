import type { DynamoSeverity } from '@dynamong/core/api';

export type DynamoToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

export interface DynamoToastOptions {
  message: string;
  title?: string;
  /** Defaults to `'info'`. */
  severity?: DynamoSeverity;
  /** Milliseconds before auto-dismiss. `0` disables auto-dismiss. Defaults to `5000`. */
  duration?: number;
  /** Whether the toast shows a manual close button. Defaults to `true`. */
  closable?: boolean;
  /** Which corner container the toast is added to. Defaults to `'top-right'`. */
  position?: DynamoToastPosition;
}
