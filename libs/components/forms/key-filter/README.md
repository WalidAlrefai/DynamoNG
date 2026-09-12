# @dynamong/key-filter

An attribute directive that restricts what can be typed or pasted into a
native `<input>`/`<textarea>` to a named pattern preset (integers, numbers,
money, hex, alpha, alphanumeric, email) or a custom `RegExp` — rejects
keystrokes as they happen rather than validating after the fact.

## Usage

```html
<input dgKeyFilter="int" />
<input [dgKeyFilter]="customPattern" />
```

```ts
protected readonly customPattern = /^[A-Z]{0,3}$/;
```

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `pattern` (alias `dgKeyFilter`) | `DynamoKeyFilterPattern` (required) | — | A preset name (`'int'`, `'pint'`, `'num'`, `'pnum'`, `'money'`, `'hex'`, `'alpha'`, `'alphanum'`, `'email'`) or a custom `RegExp`. Each preset matches against the *candidate full field value*, not just the new character, and allows the empty string and partial input (a lone `-` or `.`) so the field can be typed into progressively. |

## Outputs

None. The directive only blocks/allows native `input`/`paste` events; it does
not emit anything of its own — bind the host's own `(input)`/`ngModel`/
`formControl` as usual.

## Accessibility

- No ARIA surface of its own — it's a behavioral directive on a native form
  control, so the control's existing accessibility (label, `aria-*`) is
  unaffected. Navigation, editing, and clipboard/undo keyboard shortcuts
  (`Ctrl`/`Meta`/`Alt` combinations, and any key that isn't a single
  printable character) always pass through unfiltered.

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK.

## Running unit tests

Run `nx test forms-key-filter` to execute the unit tests.
