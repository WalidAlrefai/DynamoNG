# @dynamong/focus-trap

A standalone directive that traps `Tab`/`Shift+Tab` focus within its host
element while enabled — the same `DynamoFocusTrapService` (a thin wrapper
over CDK's `ConfigurableFocusTrapFactory`) that Dialog/Drawer/Popover/
Confirm-Dialog already use internally, exposed here for arbitrary regions
that aren't one of those components.

## Usage

```html
<div [dgFocusTrap]="isOpen()">
  <!-- focusable content trapped while isOpen() is true -->
</div>
```

```ts
protected readonly isOpen = signal(false);
```

A bare `<div dgFocusTrap>` (no binding) traps unconditionally, since the input defaults to `true`.

## Inputs

| Input                             | Type      | Default | Description                                                                                                    |
| --------------------------------- | --------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `dgFocusTrap` (aliases `enabled`) | `boolean` | `true`  | Whether the trap is active. Toggling it from `true` to `false` releases the trap; toggling back re-creates it. |

## Outputs

None.

## Accessibility

Not a visible component — it has no template or DOM of its own. It only manages keyboard focus containment on whatever host element it's applied to; the host is responsible for its own roles/labels (e.g. `role="dialog"`).

## Tier / dependencies

- `tier:0`. Peer dependencies: `@dynamong/core`, `@angular/cdk`.

## Running unit tests

Run `nx test overlay-focus-trap` to execute the unit tests.
