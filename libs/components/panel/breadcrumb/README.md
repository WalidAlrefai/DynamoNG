# @dynamong/breadcrumb

A horizontal trail of navigation links with an auto-rendered separator,
ending in a non-interactive "current page" label.

## Usage

```html
<dg-breadcrumb
  [items]="[
    { label: 'Home', href: '/' },
    { label: 'Docs', href: '/docs' },
    { label: 'Getting started' }
  ]"
  ariaLabel="Breadcrumb"
/>
```

## Inputs

| Input       | Type                                | Default     | Description                                                                                                                                                                                                                                                                                                                      |
| ----------- | ----------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`     | `DynamoBreadcrumbItem[]` (required) | —           | Each item has `label`, optional `href`, and optional `icon` (a plain glyph string, rendered `aria-hidden` before the label). The last item always renders as the current page (`aria-current="page"`), even if it has an `href` — it's never a link. Earlier items render as a link when `href` is set, otherwise as plain text. |
| `ariaLabel` | `string \| undefined`               | `undefined` | Falls back to `'Breadcrumb'` on the `<nav>` when unset.                                                                                                                                                                                                                                                                          |

## Outputs

None — a breadcrumb navigates via its items' own `href`s; there's no selection event.

## Accessibility

- `<nav [aria-label]>` wrapping an `<ol>` of items. The last item is a `<span aria-current="page">`; earlier items are `<a>` (when `href` is set) or plain `<span>`.
- Separators between items are decorative (`aria-hidden="true"`) text, not part of the list semantics.

## Design notes

`icon` follows the same plain-glyph-string convention as `@dynamong/menu`'s
`DynamoMenuItem.icon` (also used by Menubar, TieredMenu, MegaMenu, and
PanelMenu item icons) — not wired to `@dynamong/icons`, which only exports
one hardcoded checkmark component rather than a general icon-selection
system.

A dedicated `home`/`homeAriaLabel` (an icon-only leading crumb) is still
intentionally not offered: `items` accepts per-item `icon`, so
`{ label: 'Home', icon: '🏠', href: '/' }` already covers the same
navigational need without a separate shortcut input.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@dynamong/core`, `@dynamong/utils` (plus Angular core/CDK).

## Running unit tests

Run `nx test panel-breadcrumb` to execute the unit tests.
