# @dynamong/animate-on-scroll

A lightweight attribute directive, not a component: adds a class to its host
element the first time it scrolls into the viewport (via
`IntersectionObserver`), and optionally removes it again when the host
scrolls back out. Use it to trigger a CSS transition/animation on scroll
without writing any observer code yourself.

## Usage

```html
<div
  dgAnimateOnScroll
  enterClass="opacity-100 translate-y-0"
  leaveClass="opacity-0 translate-y-4"
  [once]="false"
  class="opacity-0 translate-y-4 transition-all duration-500"
>
  Fades and slides in on scroll.
</div>
```

```ts
// No outputs — there's nothing to bind to in the consuming component.
```

## Inputs

| Input                                          | Type                  | Default     | Description                                                                                                                                                                                                   |
| ---------------------------------------------- | --------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enterClass`                                   | `string` (required)   | —           | Class added to the host when it scrolls into view (or immediately, see below).                                                                                                                                |
| `leaveClass`                                   | `string \| undefined` | `undefined` | Class swapped back in when the host scrolls out of view. Only relevant when `once` is `false`; ignored (never removed) otherwise.                                                                             |
| `threshold`                                    | `number`              | `0.1`       | Forwarded directly to `IntersectionObserver`'s `threshold` option.                                                                                                                                            |
| `once`                                         | `boolean`             | `true`      | When `true`, the observer disconnects after the first entry — `enterClass` is added once and never removed. When `false`, `enterClass`/`leaveClass` toggle every time the host crosses the viewport boundary. |
| `disabled` (alias `dgAnimateOnScrollDisabled`) | `boolean`             | `false`     | When `true`, `enterClass` is applied immediately and no observer is created — same fallback path as reduced motion.                                                                                           |

## Outputs

None.

## Accessibility

- Honours `prefers-reduced-motion: reduce`: when the media query matches (or `IntersectionObserver` isn't available, e.g. during SSR), `enterClass` is applied immediately and no observer runs, so content isn't gated behind a scroll animation for users who've asked to avoid motion.
- Purely presentational — the directive does not add or change any ARIA attributes or focus behavior of its host.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core.

## Running unit tests

Run `nx test panel-animate-on-scroll` to execute the unit tests.
