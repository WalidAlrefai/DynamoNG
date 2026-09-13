# @dynamong/avatar

A user/entity image with graceful fallback to a literal label or initials
and then an icon — for profile pictures, comment authors, and member
lists. `DynamoAvatarGroup` stacks several of them into an overlapping
group.

## Usage

```html
<dg-avatar [src]="user.photoUrl" [name]="user.fullName" size="lg" />
```

```html
<!-- No image available: falls back to a literal label if set, else
     name-derived initials, then a projected/default icon -->
<dg-avatar [name]="'Ada Lovelace'" shape="square" />
<dg-avatar label="+3" />
<dg-avatar>
  <dg-icon-check icon />
</dg-avatar>

<dg-avatar-group>
  <dg-avatar [name]="'Ada Lovelace'" />
  <dg-avatar [name]="'Grace Hopper'" />
  <dg-avatar label="+3" />
</dg-avatar-group>
```

## Inputs

### `dg-avatar`

| Input            | Type                   | Default     | Description                                                                                                                                                                                               |
| ---------------- | ---------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src`            | `string \| undefined`  | `undefined` | Image URL. Falling back is automatic: unset, or the `<img>` firing an `error` event, both drop to the next tier.                                                                                          |
| `name`           | `string \| undefined`  | `undefined` | Drives derived initials (first + last token's first character for multi-word names, first two characters for a single word) and the default `alt` text.                                                   |
| `label`          | `string \| undefined`  | `undefined` | A literal override rendered instead of `name`-derived initials — for content the initials heuristic can't produce (a status glyph, an emoji, `"+3"`, ...). Still ranks below a successfully-loaded `src`. |
| `alt`            | `string \| undefined`  | `undefined` | Overrides the derived alt text (`name`, or `'Avatar'` if neither is set).                                                                                                                                 |
| `ariaLabelledBy` | `string \| undefined`  | `undefined` | Sets `aria-labelledby` alongside the existing `aria-label`, for referencing an external visible label element.                                                                                            |
| `size`           | `DynamoSize`           | `'md'`      |                                                                                                                                                                                                           |
| `shape`          | `'circle' \| 'square'` | `'circle'`  |                                                                                                                                                                                                           |

A `[icon]`-attributed element projected as content replaces the default
generic-person SVG in the final fallback tier (shown only once there's no
image, `label`, or `name`):

```html
<dg-avatar><dg-icon-check icon /></dg-avatar>
```

### `dg-avatar-group`

No inputs beyond the inherited `styleClass`/`unstyled`. Content-projects
`<dg-avatar>` children, overlapping them with a ring matching the page
background.

## Outputs

| Output       | Payload | Fires when                                                                                                                                                                            |
| ------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `imageError` | `Event` | `src` fails to load. The component already falls back to `label`/initials/icon on its own — this is for a consumer that also wants to react (logging, retrying with a different URL). |

## Accessibility

- `dg-avatar`'s root is `role="img"` with `aria-label` set to the resolved
  alt text (and `aria-labelledby` when `ariaLabelledBy` is set); the
  image, label/initials, and icon fallback tiers are all `aria-hidden` so
  the label is announced exactly once regardless of which tier is
  showing.
- `dg-avatar-group`'s root is `role="group"`.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test data-avatar` to execute the unit tests.
