export type DynamoEditorPart =
  'root' | 'toolbar' | 'button' | 'content' | 'characterCount';

/**
 * Handles an image selected via the toolbar's Insert Image button. Resolve
 * with a URL to insert it (typically after uploading `file` somewhere);
 * resolve with `null` to cancel the insertion silently. A rejected promise
 * is swallowed defensively (with a dev-mode console warning) rather than
 * left as an uncaught rejection. When no `onImageUpload` handler is
 * configured, the default behavior inserts the file as a base64 data URI
 * instead.
 */
export type DynamoEditorImageUploadFn = (file: File) => Promise<string | null>;

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
