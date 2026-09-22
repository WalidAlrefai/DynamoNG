export type DynamoEditorPart = 'root' | 'toolbar' | 'button' | 'content';

export type DynamoEditorCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'createLink'
  | 'undo'
  | 'redo'
  | 'justifyLeft'
  | 'justifyCenter'
  | 'justifyRight'
  | 'justifyFull'
  | 'insertImage';

/**
 * The block-level format of the current selection, as reflected by the
 * toolbar's "Text style" `<select>`. `formatBlock` isn't part of
 * `DynamoEditorCommand` — it's a value-taking, mutually-exclusive
 * block-level command (not a boolean toggle), handled by its own dedicated
 * method rather than the `onFormat` toggle path, the same way `createLink`
 * already does.
 */
export type DynamoEditorBlockFormat = 'p' | 'h1' | 'h2' | 'h3';

/**
 * Identifies one of the toolbar's 13 controls for layout purposes — a
 * separate id set from `DynamoEditorCommand` since this is about "which
 * control is this" (e.g. `alignLeft`), not execCommand semantics (e.g. the
 * command name `justifyLeft`). `heading` has no command at all — it's the
 * "Text style" `<select>`.
 */
export type ToolbarItemId =
  | 'undo'
  | 'redo'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'justify'
  | 'bulletedList'
  | 'numberedList'
  | 'heading'
  | 'link'
  | 'image';
