# @dynamong/avatar

A user/entity image with graceful fallback to initials and then a generic
icon — for profile pictures, comment authors, and member lists.

## Usage

```html
<dg-avatar [src]="user.photoUrl" [name]="user.fullName" size="lg" />
```

```html
<!-- No image available: falls back to initials, then the icon -->
<dg-avatar [name]="'Ada Lovelace'" />
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `src` | `string \| undefined` | `undefined` | Image URL. Falling back is automatic: unset, or the `<img>` firing an `error` event, both drop to the next tier. |
| `name` | `string \| undefined` | `undefined` | Drives derived initials (first + last token's first character for multi-word names, first two characters for a single word) and the default `alt` text. |
| `alt` | `string \| undefined` | `undefined` | Overrides the derived alt text (`name`, or `'Avatar'` if neither is set). |
| `size` | `DynamoSize` | `'md'` | |

## Outputs

None.

## Accessibility

- Root is `role="img"` with `aria-label` set to the resolved alt text; the image, initials, and icon fallback tiers are all `aria-hidden` so the label is announced exactly once regardless of which tier is showing.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test data-avatar` to execute the unit tests.
