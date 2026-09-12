# @dynamong/toast

An imperative toast/snackbar notification service — call it from any
component or service to show a transient message. DynamoNG creates and
positions the notification card itself via CDK Overlay; there is no
`<dg-toast>` element to place in a template.

## Usage

```ts
import { DynamoToastService } from '@dynamong/toast';

export class SaveButton {
  private readonly toast = inject(DynamoToastService);

  protected onSave(): void {
    this.toast.success('Changes saved');
  }

  protected onSessionExpiring(): void {
    this.toast.show({
      title: 'Session expiring',
      message: 'You will be signed out in 2 minutes.',
      severity: 'warning',
      position: 'bottom-center',
      duration: 8000,
    });
  }
}
```

## `DynamoToastOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `message` | `string` (required) | — | |
| `title` | `string \| undefined` | `undefined` | |
| `severity` | `DynamoSeverity` | `'info'` | |
| `duration` | `number` | `5000` | Milliseconds before auto-dismiss. `0` disables auto-dismiss. |
| `closable` | `boolean` | `true` | Whether the toast shows a manual close button. |
| `position` | `DynamoToastPosition` | `'top-right'` | One of `'top-right'`, `'top-left'`, `'bottom-right'`, `'bottom-left'`, `'top-center'`, `'bottom-center'`. Each position gets its own stacked overlay container, created lazily on first use. |

## Methods

| Method | Returns | Description |
|---|---|---|
| `show(options)` | `string` (toast id) | Shows a toast with full control over every option. |
| `success(message, options?)` | `string` | Shorthand for `show()` with `severity: 'success'`. |
| `info(message, options?)` | `string` | Shorthand for `show()` with `severity: 'info'`. |
| `warning(message, options?)` | `string` | Shorthand for `show()` with `severity: 'warning'`. |
| `error(message, options?)` | `string` | Shorthand for `show()` with `severity: 'danger'`. |
| `dismiss(id)` | `void` | Dismisses one toast early. |
| `dismissAll()` | `void` | Dismisses every currently-visible toast, across all positions. |

## Accessibility

- Each position's container renders `role="status"` with `aria-live="polite"`, so new toasts are announced without stealing focus. The manual close button carries `aria-label="Dismiss notification"`.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test feedback-toast` to execute the unit tests.
