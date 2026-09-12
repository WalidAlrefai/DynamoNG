# @dynamong/confirm-dialog

A promise-based confirm prompt, invoked imperatively from a service rather
than placed in a template. Use it in place of the browser's `confirm()` for
destructive or consequential actions.

## Usage

```ts
private readonly confirmService = inject(DynamoConfirmService);

protected async onDelete(): Promise<void> {
  const confirmed = await this.confirmService.open({
    title: 'Delete item',
    message: 'This cannot be undone.',
    confirmLabel: 'Delete',
    severity: 'danger',
  });
  if (confirmed) {
    // proceed
  }
}
```

There is no `<dg-confirm-dialog>` element to place in a template — `DynamoConfirmService` mounts its own `DynamoConfirmContainer` into a global CDK overlay on demand, the same pattern `@dynamong/toast` uses.

## Inputs

`DynamoConfirmService.open()` takes a `DynamoConfirmOptions` object:

| Option | Type | Default | Description |
|---|---|---|---|
| `message` | `string` (required) | — | The prompt body. |
| `title` | `string \| undefined` | `undefined` | Optional heading. |
| `confirmLabel` | `string` | `'Confirm'` | |
| `cancelLabel` | `string` | `'Cancel'` | |
| `severity` | `DynamoSeverity` | `'primary'` | Forwarded to the confirm button's `severity`; use `'danger'` for destructive actions. |
| `closeOnBackdropClick` | `boolean` | `true` | |
| `closeOnEscape` | `boolean` | `true` | |

## Outputs

None — `open()` returns a `Promise<boolean>` instead: resolves `true` if confirmed, `false` if cancelled, backdrop-clicked (when allowed), or `Escape`-dismissed (when allowed). Only one prompt is shown at a time; calling `open()` again while one is active queues the request until the current one settles. `confirm()`/`cancel()` on the service programmatically settle the currently-showing prompt as if its buttons were clicked.

## Accessibility

- The mounted panel is `role="alertdialog"` with `aria-modal="true"`, `aria-labelledby`/`aria-describedby` when a `title` is set (otherwise `aria-label` falls back to the message), and is focus-trapped with initial focus moved into the panel and restored to the previously-focused element on close.
- `Escape` (when `closeOnEscape` is true) cancels, matching the Cancel button.

## Tier / dependencies

- `tier:2`. Peer dependencies: `@dynamong/core`, `@dynamong/utils`, `@dynamong/button`, `@angular/cdk`, `rxjs`.

## Running unit tests

Run `nx test overlay-confirm-dialog` to execute the unit tests.
