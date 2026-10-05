# @dynamong/editor

A minimal rich-text editor — a `contenteditable` region with a formatting
toolbar for undo/redo, bold, italic, underline, alignment, headings, lists,
links, and image embedding. Wired up as an Angular `ControlValueAccessor`;
all HTML is sanitized before it's stored on `value` or emitted.

## Usage

```html
<dg-editor [(value)]="bioHtml" ariaLabel="Bio" />
```

```ts
protected bioHtml = signal('<p>Hello</p>');
```

## Inputs

| Input              | Type                                                     | Default     | Description                                                                                                                                                                                                        |
| ------------------ | -------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `value`            | `string` (model)                                         | `''`        | Two-way bindable HTML string; also driven by Angular forms via `writeValue`. Always passed through `DomSanitizer.sanitize(SecurityContext.HTML, …)` before being stored or emitted.                                |
| `ariaLabel`        | `string \| undefined`                                    | `undefined` | Accessible name for the editable region when no visible `<label>` wraps it.                                                                                                                                        |
| `ariaDescribedby`  | `string \| undefined`                                    | `undefined` | Forwarded as `aria-describedby` on the editable content region.                                                                                                                                                    |
| `invalid`          | `boolean`                                                | `false`     | Tints the root border/focus ring to the danger color, matching every other form control in this library.                                                                                                           |
| `disabled`         | `boolean` (model)                                        | `false`     | Two-way bindable; also driven by Angular forms via `setDisabledState`. Disabling also removes the `contenteditable` attribute from the content region.                                                             |
| `fluid`            | `boolean`                                                | `true`      | Fills the width of its container. Set `false` for intrinsic/content-based width.                                                                                                                                   |
| `placeholder`      | `string \| undefined`                                    | `undefined` | Shown via CSS (`:empty:before`) whenever the content is empty — the contenteditable equivalent of a native `placeholder`.                                                                                          |
| `readOnly`         | `boolean`                                                | `false`     | HTML `readonly` semantics: the content stays visible, focusable, and selectable (native browser text selection/copy), but typing and toolbar commands are blocked. Unlike `disabled`, does not dim its appearance. |
| `pasteAsPlainText` | `boolean`                                                | `false`     | Strips formatting from pasted content, inserting it as plain text only.                                                                                                                                            |
| `maxLength`        | `number \| undefined`                                    | `undefined` | Shows a `current / max` character count below the content region. A soft indicator only — typing/pasting past the limit is still allowed; only the count's styling flags it as over-limit.                         |
| `toolbarButtons`   | `readonly ToolbarItemId[] \| undefined`                  | `undefined` | Restricts the toolbar to a subset of its 14 controls. An inclusion filter only — the configured subset always renders in the library's own fixed canonical order, never the order you list them in.                |
| `onImageUpload`    | `((file: File) => Promise<string \| null>) \| undefined` | `undefined` | Intercepts image insertion. Resolve a URL to insert it (e.g. after uploading `file`); resolve `null` to cancel silently. Unset keeps the default base64/`FileReader` fallback.                                     |

## Outputs

| Output           | Payload   | Fires when                                                                                                                                                                       |
| ---------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `valueChange`    | `string`  | `value` changes (auto-generated by `model()`) — on typed input or a toolbar command (undo/redo/bold/italic/underline/alignment/heading/lists/link/image); always sanitized HTML. |
| `disabledChange` | `boolean` | `disabled` changes (auto-generated by `model()`).                                                                                                                                |

## Accessibility

- The toolbar is `role="toolbar"` with `aria-label="Formatting"`; each stateful formatting button (bold/italic/underline/alignment/lists — Undo, Redo, Insert Link, and Insert Image have no persistent "active" state) reflects its live state via `aria-pressed`, kept in sync with `document.queryCommandState` on every selection change.
- The "Text style" heading control is a native `<select>` (Paragraph/Heading 1/2/3) — mutually exclusive block-level state, unlike the toggle buttons, so it uses native combobox semantics instead of `aria-pressed`. Its selected option is kept in sync with `document.queryCommandValue('formatBlock')` on every selection change.
- The editable region is `role="textbox"` with `aria-multiline="true"`, plus `aria-label`/`aria-invalid` set as provided.
- When the toolbar is too narrow to show every control, a trailing "More formatting options" button (`aria-haspopup`/`aria-expanded`/`aria-controls`) opens a `role="group"` panel containing the overflowed controls, each with a visible text label alongside its icon.

## Design notes

**Images are embedded as base64 data URIs, not object URLs.** Inserting an
image (`execCommand('insertImage', ...)`) embeds a `data:image/...;base64,...`
URI directly in the stored HTML, generated via `FileReader.readAsDataURL`.
This was chosen over `URL.createObjectURL` (this library's own
`@dynamong/file-upload` precedent) because object URLs are scoped to the
page session that created them and go blank after a reload — a correctness
bug for `value`, which is meant to be persisted/round-tripped. The
trade-off is a bloated stored HTML string (base64 is roughly a third larger
than the source file) with no built-in size limit — past 2MB, a dev-mode
`console.warn` fires as a nudge, but nothing is rejected. This is only the
_default_ behavior — configure `onImageUpload` to upload the file yourself
and insert a hosted URL instead; that path skips both the base64 bloat and
the size warning entirely.

**Undo/redo are a mouse-accessible affordance for capability that already
exists.** Native Ctrl+Z/Ctrl+Y already work on any `contenteditable` region
with zero code; the toolbar buttons just call `document.execCommand('undo'
| 'redo')`. This command is well known to be flaky/inconsistent across
browser engines (unlike, say, `bold`/`italic`, which are rock solid) —
treat it as best-effort, not a guaranteed undo stack. There is also no
dynamic disabled state for these buttons (`document.queryCommandEnabled` is
itself deprecated/unreliable) — they're enabled whenever the editor itself
is enabled, full stop.

**Headings use `document.execCommand('formatBlock', ...)`/
`queryCommandValue('formatBlock')`**, both deprecated-but-universally-
supported. Cross-browser return-value casing/format for the readback has
historically varied; it's normalized defensively and falls back to
"Paragraph" for anything unrecognized rather than throwing.

**Toolbar overflow never wraps to a second row — it collapses trailing
items into a "⋯" panel instead**, using fixed, hardcoded per-item widths
(28px per button, a 112px heading `<select>`) rather than live
`getBoundingClientRect()` measurement, checked against the toolbar's
`ResizeObserver`-measured width. This keeps the calculation cheap and
synchronous, at the cost of needing `editor.styles.ts`'s width classes and
`editor.ts`'s matching width constants to be updated together if either
ever changes. The panel is rendered through `DynamoOverlayService` (a
`type:core` foundation lib, not a `@dynamong/*` component — so this adds
no tier bump), the same mechanism `@dynamong/menu` uses — chosen over
reusing `@dynamong/menu` itself because its item API has no icon/
active-state/embedded-form-control support that the overflowed controls
need. The panel is `role="group"`, not `role="menu"`, since it mixes
toggle buttons and a native `<select>` — not a pure command list — and it
only supports Escape-to-close plus native Tab order, not Arrow-key roving
focus, for the same reason.

**Paste is intercepted, not left to the browser's native handling.** The
only sanitization in this component is `commitHtml`'s single
`DomSanitizer.sanitize(SecurityContext.HTML, …)` call — but that only ever
runs on the _outgoing_ bound value. Without interception, the browser's own
native paste handling inserts clipboard HTML directly into the live DOM
_before_ that sanitize call ever runs, which is a DOM-based-XSS vector: a
clipboard payload like `<img src=x onerror=...>` can self-execute on
insertion. A `(paste)` listener calls `event.preventDefault()` to block the
native (unsanitized) insertion, sanitizes the clipboard's `text/html`
content through the same `DomSanitizer` instance _before_ it ever touches
the DOM, then inserts it via `execCommand('insertHTML', ...)` — the same
mechanism every other mutation in this component already uses, which also
keeps paste in the native undo stack (a manual Range-API insertion would
silently drop it from undo).

**`maxLength` is a soft indicator, not an enforced cap.** `contenteditable`
has no native equivalent to a `<textarea maxlength>` — a true hard block
would need a `beforeinput` listener with its own caret/IME/paste edge
cases. Typing or pasting past the configured limit is still accepted; only
the character count's styling flips to the danger color.

**`toolbarButtons` is an inclusion filter, not a reordering mechanism.** A
configured subset always renders in the library's own fixed canonical
order (the same order used for the overflow-collapse priority), regardless
of the order ids appear in the input array. Reordering would require
rewriting the toolbar into a fully data-driven loop — a much larger,
riskier change than this input's actual use case (hiding controls a given
consumer doesn't need) calls for.

**`onImageUpload`'s `savedRange` is one shared field, not per-call state.**
Starting a second image insertion before the first handler's promise
settles overwrites the caret/selection the second insertion will land at.
This is pre-existing (the default base64/`FileReader` path has the same
issue, just with a much shorter async window) rather than introduced by
the hook — a cheap future fix is capturing the range in a per-call local
instead of a shared instance field.

**The selected file's MIME type is checked via `file.type`, which is
spoofable.** Real magic-byte sniffing was considered and rejected as
disproportionate: it's nontrivial to do correctly across
PNG/JPEG/GIF/WEBP _and_ SVG (which has no magic bytes — it's XML text), for
a gap that's cosmetic at worst (a spoofed type can at most land a
non-image as an `<img src>`, never executable content).

## Tier / dependencies

- `tier:0`. Peer dependencies: none beyond Angular core/CDK. Image
  embedding uses only native browser APIs (`FileReader`, a hand-rolled
  hidden `<input type="file">`) — no dependency on `@dynamong/file-upload`.

## Running unit tests

Run `nx test forms-editor` to execute the unit tests.
