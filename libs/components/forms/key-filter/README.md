# @dynamong/key-filter

An attribute directive that restricts what can be typed or pasted into a
native `<input>`/`<textarea>` to a named pattern preset (integers, numbers,
money, hex, alpha, alphanumeric, email) or a custom `RegExp` — rejects
keystrokes as they happen rather than validating after the fact.

## Usage

```html
<input dgKeyFilter="int" /> <input [dgKeyFilter]="customPattern" />
```

```ts
protected readonly customPattern = /^[A-Z]{0,3}$/;
```

`validateOnly` flips the directive from blocking to passive: keystrokes are
never prevented, and a bound `FormControl`/`ngModel` instead gets a
`keyFilter` validation error whenever the current value fails the pattern.

```html
<input [dgKeyFilter]="'int'" [validateOnly]="true" [formControl]="qty" />
```

## Inputs

| Input                           | Type                                | Default | Description                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------- | ----------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pattern` (alias `dgKeyFilter`) | `DynamoKeyFilterPattern` (required) | —       | A preset name (`'int'`, `'pint'`, `'num'`, `'pnum'`, `'money'`, `'hex'`, `'alpha'`, `'alphanum'`, `'email'`) or a custom `RegExp`. Each preset matches against the _candidate full field value_, not just the new character, and allows the empty string and partial input (a lone `-` or `.`) so the field can be typed into progressively. |
| `validateOnly`                  | `boolean`                           | `false` | When true, invalid keystrokes are never blocked; instead the directive registers as an `NG_VALIDATORS` `Validator` and reports a `{ keyFilter: true }` error on the bound control whenever its current value fails the pattern.                                                                                                              |

## Outputs

None. The directive only blocks/allows native `input`/`paste` events (unless
`validateOnly` is set); it does not emit anything of its own — bind the
host's own `(input)`/`ngModel`/`formControl` as usual.

## Accessibility

- No ARIA surface of its own — it's a behavioral directive on a native form
  control, so the control's existing accessibility (label, `aria-*`) is
  unaffected. Navigation, editing, and clipboard/undo keyboard shortcuts
  (`Ctrl`/`Meta`/`Alt` combinations, and any key that isn't a single
  printable character) always pass through unfiltered.

## Tier / dependencies

- `tier:0`. Peer dependencies: `@angular/forms` (`NG_VALIDATORS`/`Validator`, used only in `validateOnly` mode).

## Running unit tests

Run `nx test forms-key-filter` to execute the unit tests.
