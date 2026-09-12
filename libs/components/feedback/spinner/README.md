# @dynamong/spinner

A small inline loading indicator (animated ring). Use it standalone when a
busy state needs to be announced on its own, or embedded inside another
component (e.g. Button's `loading` state) where it's purely decorative.

## Usage

```html
<dg-spinner size="lg" ariaLabel="Loading results" />
```

```ts
protected readonly isLoading = signal(true);
```

## Inputs

| Input       | Type                  | Default     | Description                                                                                                                                                                                     |
| ----------- | --------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `size`      | `DynamoSize`          | `'md'`      |                                                                                                                                                                                                 |
| `ariaLabel` | `string \| undefined` | `undefined` | Accessible name for a standalone, announced loading indicator. Leave unset when the spinner is embedded inside something that already announces its own busy state (e.g. Button's `aria-busy`). |

## Outputs

None — this component has no outputs.

## Accessibility

- When `ariaLabel` is set, renders `role="status"` + `aria-label` so screen readers announce the loading state. When unset, renders `aria-hidden="true"` instead, since the host is expected to announce its own busy state.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test feedback-spinner` to execute the unit tests.
