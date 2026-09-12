# @dynamong/skeleton

A pulsing placeholder block shown in place of content that hasn't loaded
yet — text lines, avatars, and cards.

## Usage

```html
<dg-skeleton variant="circular" [width]="40" [height]="40" />
<dg-skeleton variant="text" />
<dg-skeleton variant="rectangular" height="120px" />
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `variant` | `DynamoSkeletonVariant` | `'text'` | `'text' \| 'circular' \| 'rectangular'`. Each variant has its own default size class (e.g. `text` is a full-width line, `circular` is a 40px circle). |
| `width` | `string \| number \| undefined` | `undefined` | Overrides the variant's default width. A number is treated as px; a string is used as-is (e.g. `'50%'`). |
| `height` | `string \| number \| undefined` | `undefined` | Same rules as `width`. |

## Outputs

None.

## Accessibility

- Root is `aria-hidden="true"` — it carries no content or semantics, so it's hidden from assistive tech entirely. The animation respects reduced motion (`motion-reduce:animate-none`).

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test feedback-skeleton` to execute the unit tests.
