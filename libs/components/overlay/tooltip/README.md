# @dynamong/tooltip

A short, plain-text hint shown on hover and/or focus of the wrapped trigger
element. Use it for a compact label on an icon button or truncated text —
not for anything interactive (use Popover instead).

## Usage

```html
<dg-tooltip [content]="tooltipText()" position="top" trigger="both">
  <dg-button icon="save" ariaLabel="Save" />
</dg-tooltip>
```

```ts
protected readonly tooltipText = signal('Save changes');
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `content` | `string` | `''` | Plain-text hint. Nothing is shown, and the tooltip never opens, while empty/whitespace-only. |
| `position` | `DynamoTooltipPosition` | `'top'` | Preferred side; its opposite is tried first on collision, then the two remaining sides. |
| `showDelay` | `number` | `300` | Milliseconds of hover/focus before the tooltip attaches. |
| `hideDelay` | `number` | `0` | Milliseconds before a hover-triggered hide (`mouseleave`) detaches the panel. Focus-out and `Escape` always hide immediately. |
| `disabled` | `boolean` | `false` | Suppresses showing; force-hides an already-visible tooltip the instant it becomes `true`. |
| `trigger` | `DynamoTooltipTrigger` | `'both'` | `'hover'`, `'focus'`, or `'both'`. Defaults to `'both'` so keyboard-only users can reach it too (WCAG 1.4.13). |

## Outputs

None — Tooltip has no `model()` or `output()`; its visibility is entirely internal, driven by hover/focus/`disabled`.

## Accessibility

- The trigger wrapper carries `aria-describedby` pointing at the tooltip's `id` only while it's visible; the panel itself is `role="tooltip"`.
- Shows on `mouseenter`/`focusin` (gated by `trigger`) and hides on `mouseleave`/`focusout`/`Escape`.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@dynamong/core`, `@dynamong/utils`, `@angular/cdk`.

## Running unit tests

Run `nx test overlay-tooltip` to execute the unit tests.
