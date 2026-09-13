# @dynamong/ripple

A Material-style pointer-ripple directive — not a standalone component.
Apply `dgRipple` to any host element to spawn an expanding, fading ripple
span at the pointer-down point, animated with the Web Animations API (no
global CSS keyframes required).

## Usage

```html
<button dgRipple type="button">Click me</button>

<button
  dgRipple
  dgRippleColor="rgba(255, 255, 255, 0.4)"
  [dgRippleDisabled]="isDisabled()"
  type="button"
>
  Custom tint
</button>
```

## Inputs

| Input                           | Type                  | Default     | Description                                                            |
| ------------------------------- | --------------------- | ----------- | ---------------------------------------------------------------------- |
| `dgRippleDisabled` (`disabled`) | `boolean`             | `false`     | Suppresses ripple spawning.                                            |
| `dgRippleColor` (`color`)       | `string \| undefined` | `undefined` | Overrides the default `bg-current/30` tint with an explicit CSS color. |

## Outputs

None.

## Accessibility

- Purely visual. The ripple `<span>` is `aria-hidden`, doesn't intercept pointer events beyond spawning on `pointerdown`, and is skipped entirely when the user has `prefers-reduced-motion: reduce` set.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/common (does not depend on `@dynamong/core`).

## Running unit tests

Run `nx test forms-ripple` to execute the unit tests.
