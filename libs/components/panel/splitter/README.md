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

### `dg-splitter-panel`

| Input         | Type                  | Default     | Description                                                                                      |
| ------------- | --------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `initialSize` | `number \| undefined` | `undefined` | Initial size as a percentage (0-100). Panels that omit it split the remaining percentage evenly. |
| `minSize`     | `number`              | `0`         | Minimum size (percentage) this panel can be resized down to.                                     |

`dg-splitter-panel` renders no DOM of its own — `DynamoSplitter` reads it via `contentChildren()` and stamps out the sized wrapper itself, so it does not extend the base component and has no `styleClass`/`pt`/`unstyled`.

## Outputs

This component has no outputs. Panel sizes are recomputed internally (`sizes` is a plain signal, not a `model()`) whenever the set of panels changes, and updated live during drag/keyboard resize — there is no bindable, controlled size state.

## Accessibility

- Each divider is `role="separator"` with `aria-orientation`, `aria-valuenow`/`aria-valuemin`/`aria-valuemax` (reflecting the true resizable range against its neighboring panel's `minSize`), and `aria-disabled` when `disabled`.
- Dividers are focusable (`tabindex="0"`, or `-1` when `disabled`) and resizable via `ArrowLeft`/`ArrowRight` (horizontal) or `ArrowUp`/`ArrowDown` (vertical) in 5% steps, plus `Home`/`End` to jump to the minimum/maximum. Resizing only ever redistributes size between the two adjacent panels; other panels' sizes are untouched.
- Also supports pointer drag on the divider.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@angular/common`, `@angular/cdk`, `@dynamong/core`, `@dynamong/utils`.

## Running unit tests

Run `nx test panel-splitter` to execute the unit tests.
