export interface DocComponentEntry {
  slug: string;
  name: string;
  domain: 'forms' | 'overlay' | 'panel' | 'feedback' | 'data';
  description: string;
}

/**
 * Drives both the sidebar nav and the route table below — adding a component
 * here is the only manual step; everything else (nav entry, route) follows.
 * The full plan's version of this is generator-driven (a new component's
 * scaffold auto-appends its registry entry); this hand-maintained list is the
 * scaled-down version built in this session.
 */
export const COMPONENT_REGISTRY: DocComponentEntry[] = [
  {
    slug: 'button',
    name: 'Button',
    domain: 'forms',
    description:
      'Triggers an action. Supports severity, size, variant, and a loading state.',
  },
  {
    slug: 'checkbox',
    name: 'Checkbox',
    domain: 'forms',
    description:
      'A tri-state (checked / unchecked / indeterminate) toggle control.',
  },
  {
    slug: 'radio',
    name: 'Radio',
    domain: 'forms',
    description:
      'A single-selection control among a group of native radio inputs sharing a name.',
  },
  {
    slug: 'switch',
    name: 'Switch',
    domain: 'forms',
    description: 'A boolean on/off toggle control.',
  },
  {
    slug: 'input-text',
    name: 'Input Text',
    domain: 'forms',
    description:
      'A single-line text input with full Angular Forms (ControlValueAccessor) integration.',
  },
  {
    slug: 'textarea',
    name: 'Textarea',
    domain: 'forms',
    description:
      'A multi-line text input with full Angular Forms (ControlValueAccessor) integration and optional auto-resize.',
  },
  {
    slug: 'select',
    name: 'Select',
    domain: 'forms',
    description:
      'A single-select combobox with full keyboard navigation, ARIA combobox semantics, and optional filtering.',
  },
  {
    slug: 'multi-select',
    name: 'Multi Select',
    domain: 'forms',
    description:
      'A multi-select combobox with tag display, filtering, a header select-all/clear-all checkbox, a max-selection cap, and option grouping.',
  },
  {
    slug: 'date-picker',
    name: 'Date Picker',
    domain: 'forms',
    description:
      'A single-date picker with a month-grid calendar dialog, full keyboard navigation, and ARIA grid semantics.',
  },
  {
    slug: 'pagination',
    name: 'Pagination',
    domain: 'forms',
    description:
      'A pagination control with windowed page-number navigation, ellipsis truncation, and a rows-per-page selector, built from DynamoButton and DynamoSelect.',
  },
  {
    slug: 'dialog',
    name: 'Dialog',
    domain: 'overlay',
    description:
      'A modal dialog with CDK-powered focus trapping and Escape/backdrop-to-close.',
  },
  {
    slug: 'drawer',
    name: 'Drawer',
    domain: 'overlay',
    description:
      'An off-canvas panel that slides in from a screen edge, with CDK-powered focus trapping and Escape/backdrop-to-close.',
  },
  {
    slug: 'tooltip',
    name: 'Tooltip',
    domain: 'overlay',
    description:
      'A hover/focus-triggered hint positioned by CDK Overlay with viewport-collision flipping.',
  },
  {
    slug: 'tabs',
    name: 'Tabs',
    domain: 'panel',
    description:
      'A tabbed content switcher with full keyboard navigation and ARIA tabs semantics.',
  },
  {
    slug: 'accordion',
    name: 'Accordion',
    domain: 'panel',
    description:
      'A collapsible content switcher with full keyboard navigation and ARIA accordion semantics.',
  },
  {
    slug: 'menu',
    name: 'Menu',
    domain: 'overlay',
    description:
      'A dropdown action menu positioned by CDK Overlay, with full keyboard navigation and ARIA menu semantics.',
  },
  {
    slug: 'toast',
    name: 'Toast',
    domain: 'feedback',
    description:
      'A global, imperative notification service — inject and call, no template tag required.',
  },
  {
    slug: 'badge',
    name: 'Badge',
    domain: 'feedback',
    description: 'A small, severity-colored label for status or metadata.',
  },
  {
    slug: 'card',
    name: 'Card',
    domain: 'panel',
    description:
      'A content container with an optional header, body, and footer.',
  },
  {
    slug: 'alert',
    name: 'Alert',
    domain: 'feedback',
    description:
      'A persistent, severity-colored in-page status message, optionally closable.',
  },
  {
    slug: 'chip',
    name: 'Chip',
    domain: 'feedback',
    description: 'A compact, optionally-removable label.',
  },
  {
    slug: 'table',
    name: 'Table',
    domain: 'data',
    description:
      'A data table driven by a plain column-definition array, with client-side single-column sorting, pagination, row selection, global filtering, and per-column cell-template projection.',
  },
  {
    slug: 'spinner',
    name: 'Spinner',
    domain: 'feedback',
    description:
      'A small loading indicator — decorative by default, or an announced status region when given a label.',
  },
  {
    slug: 'avatar',
    name: 'Avatar',
    domain: 'data',
    description:
      'A user image with initials/icon fallback, for user-related data displays like table rows.',
  },
  {
    slug: 'progress',
    name: 'Progress',
    domain: 'feedback',
    description:
      'A determinate linear progress bar with severity-colored fill.',
  },
  {
    slug: 'divider',
    name: 'Divider',
    domain: 'panel',
    description:
      'A horizontal or vertical rule, optionally with a centered label.',
  },
];
