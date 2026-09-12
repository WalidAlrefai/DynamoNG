# @dynamong/overlay-badge

Overlays a small `@dynamong/badge` (a count) or a bare dot on top of any
single projected element — an unread indicator on an avatar, an icon
button, etc.

## Usage

```html
<dg-overlay-badge [value]="unreadCount()" [max]="99" severity="danger" position="top-right">
  <dg-button variant="text" ariaLabel="Notifications">
    <dg-icon-bell />
  </dg-button>
</dg-overlay-badge>
```

```ts
protected readonly unreadCount = signal(3);
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `value` | `string \| number \| undefined` | `undefined` | |
| `dot` | `boolean` | `false` | Forces the bare-dot style. Also the default when `value` is empty/unset. |
| `max` | `number \| undefined` | `undefined` | A numeric `value` above `max` renders as `` `${max}+` ``. |
| `severity` | `DynamoSeverity` | `'danger'` | |
| `position` | `DynamoOverlayBadgePosition` (`'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'`) | `'top-right'` | |

## Outputs

None — this component has no outputs.

## Accessibility

- The marker (dot or badge) is decorative (`aria-hidden`). Label the wrapped control yourself — e.g. `aria-label="Notifications, 3 unread"` on the projected button.

## Tier / dependencies

- `tier:1`. Peer dependencies: `@dynamong/badge`.

## Running unit tests

Run `nx test feedback-overlay-badge` to execute the unit tests.
