export type DynamoEditorPart = 'root' | 'toolbar' | 'button' | 'content';

export type DynamoEditorCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'createLink';
