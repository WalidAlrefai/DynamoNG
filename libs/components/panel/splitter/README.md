# @dynamong/splitter

A resizable multi-pane layout: drag (or keyboard-move) the dividers between
projected `<dg-splitter-panel>` children to redistribute space between
them.

## Usage

```html
<dg-splitter orientation="horizontal">
  <dg-splitter-panel [initialSize]="30" [minSize]="15">
    <nav>Sidebar</nav>
  </dg-splitter-panel>
  <dg-splitter-panel [minSize]="30">
    <main>Content</main>
  </dg-splitter-panel>
</dg-splitter>
```

```ts
// No outputs to bind — panel sizes are internal, uncontrolled state.
```

## Inputs

### `dg-splitter`

| Input         | Type                         | Default        | Description                                                                                       |
| ------------- | ---------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout axis of the panels and their dividers.                                                     |
| `disabled`    | `boolean`                    | `false`        | Dividers become non-interactive (no drag, no keyboard resize) and are removed from the tab order. |
| `gutterSize`  | `number`                     | `8`            | Divider thickness in pixels.                                                                      |
| `step`        | `number`                     | `5`            | Percentage points a single keyboard press (arrow key) resizes by.                                 |

### `dg-splitter-panel`

| Input         | Type                  | Default     | Description                                                                                      |
| ------------- | --------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `initialSize` | `number \| undefined` | `undefined` | Initial size as a percentage (0-100). Panels that omit it split the remaining percentage evenly. |
| `minSize`     | `number`              | `0`         | Minimum size (percentage) this panel can be resized down to.                                     |

`dg-splitter-panel` renders no DOM of its own — `DynamoSplitter` reads it via `contentChildren()` and stamps out the sized wrapper itself, so it does not extend the base component and has no `styleClass`/`pt`/`unstyled`.

## Outputs

| Output      | Payload    | Fires when                                                                                    |
| ----------- | ---------- | --------------------------------------------------------------------------------------------- |
| `resizeEnd` | `number[]` | A drag (on pointerup) or keyboard resize (per keypress) completes, with the full sizes array. |

Sizes themselves stay internal, uncontrolled state (`sizes` is a plain signal, not a `model()`) — `resizeEnd` is read-only notification, useful for persisting the layout yourself (e.g. to `localStorage`).

## Accessibility

- Each divider is `role="separator"` with `aria-orientation`, `aria-valuenow`/`aria-valuemin`/`aria-valuemax` (reflecting the true resizable range against its neighboring panel's `minSize`), and `aria-disabled` when `disabled`.
- Dividers are focusable (`tabindex="0"`, or `-1` when `disabled`) and resizable via `ArrowLeft`/`ArrowRight` (horizontal) or `ArrowUp`/`ArrowDown` (vertical) in 5% steps, plus `Home`/`End` to jump to the minimum/maximum. Resizing only ever redistributes size between the two adjacent panels; other panels' sizes are untouched.
- Also supports pointer drag on the divider.

## Design notes

Auto-persisting sizes to session/local storage was considered and left out:
no component in this codebase owns browser-storage side effects internally
— persistence is left to the consumer, who can wire it up themselves via
`resizeEnd`. Per-panel style/class passthrough inputs were also left out
(redundant — panels are content-projected `<dg-splitter-panel>`, so a
consumer already styles them directly), as was nested-splitter detection (no
established need).

## Tier / dependencies

- `tier:0`. Peer dependencies: `@angular/common`, `@angular/cdk`, `@dynamong/core`, `@dynamong/utils`.

## Running unit tests

Run `nx test panel-splitter` to execute the unit tests.
