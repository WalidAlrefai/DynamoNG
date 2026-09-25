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

| Option                 | Type                              | Default     | Description                                                                                                                                                        |
| ---------------------- | --------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `message`              | `string` (required)               | —           | The prompt body.                                                                                                                                                   |
| `title`                | `string \| undefined`             | `undefined` | Optional heading.                                                                                                                                                  |
| `confirmLabel`         | `string`                          | `'Confirm'` |                                                                                                                                                                    |
| `cancelLabel`          | `string`                          | `'Cancel'`  |                                                                                                                                                                    |
| `severity`             | `DynamoSeverity`                  | `'primary'` | Forwarded to the confirm button's `severity`; use `'danger'` for destructive actions.                                                                              |
| `closeOnBackdropClick` | `boolean`                         | `true`      |                                                                                                                                                                    |
| `closeOnEscape`        | `boolean`                         | `true`      |                                                                                                                                                                    |
| `showCancel`           | `boolean`                         | `true`      | Hides the cancel button, for an "OK"-only informational prompt with no real decision to make.                                                                      |
| `defaultFocus`         | `'confirm' \| 'cancel' \| 'none'` | `'none'`    | Which button receives focus once the dialog opens. `'none'` focuses the panel itself, matching a plain alert dialog — neither button is pre-armed for Enter/Space. |

## Outputs

None — `open()` returns a `Promise<boolean>` instead: resolves `true` if confirmed, `false` if cancelled, backdrop-clicked (when allowed), or `Escape`-dismissed (when allowed). The promise resolves as soon as the prompt settles — before its exit animation finishes. Only one prompt is shown at a time; calling `open()` again while one is active (including one still playing its exit animation) queues the request until the current one is fully gone, never crossfading two panels. `confirm()`/`cancel()` on the service programmatically settle the currently-showing prompt as if its buttons were clicked.

## Animation

The panel pops in/out — scaling from 90% with a springy overshoot past
100% before settling — while the backdrop fades in/out alongside it,
both over 200ms and respecting `prefers-reduced-motion`.

## Accessibility

- The mounted panel is `role="alertdialog"` with `aria-modal="true"`, `aria-labelledby`/`aria-describedby` when a `title` is set (otherwise `aria-label` falls back to the message), and is focus-trapped with initial focus moved into the panel and restored to the previously-focused element on close.
- `Escape` (when `closeOnEscape` is true) cancels, matching the Cancel button.

## Tier / dependencies

- `tier:2`. Peer dependencies: `@dynamong/core`, `@dynamong/utils`, `@dynamong/button`, `@angular/cdk`, `rxjs`.

## Running unit tests

Run `nx test overlay-confirm-dialog` to execute the unit tests.
