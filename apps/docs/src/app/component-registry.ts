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
  {
    slug: 'tree',
    name: 'Tree',
    domain: 'data',
    description:
      'A hierarchical, expandable tree with keyboard navigation and multi-select tri-state checkboxes.',
  },
  {
    slug: 'stepper',
    name: 'Stepper',
    domain: 'panel',
    description:
      'A multi-step process indicator with built-in content panels and Back/Next navigation.',
  },
  {
    slug: 'popover',
    name: 'Popover',
    domain: 'overlay',
    description:
      'A generic floating panel with arbitrary projected content, positioned relative to a trigger.',
  },
  {
    slug: 'skeleton',
    name: 'Skeleton',
    domain: 'feedback',
    description: 'An animated loading-placeholder block.',
  },
  {
    slug: 'tag',
    name: 'Tag',
    domain: 'feedback',
    description: 'A static, non-removable severity-colored label.',
  },
  {
    slug: 'breadcrumb',
    name: 'Breadcrumb',
    domain: 'panel',
    description: 'A path navigation trail with a current-page indicator.',
  },
  {
    slug: 'carousel',
    name: 'Carousel',
    domain: 'panel',
    description:
      'A sliding content carousel with swipe, keyboard, and autoplay navigation.',
  },
  {
    slug: 'slider',
    name: 'Slider',
    domain: 'forms',
    description:
      'A draggable range input with keyboard stepping and click-to-jump.',
  },
  {
    slug: 'split-button',
    name: 'Split Button',
    domain: 'forms',
    description:
      'A primary action button with an attached dropdown of secondary actions.',
  },
  {
    slug: 'context-menu',
    name: 'Context Menu',
    domain: 'overlay',
    description: 'A right-click triggered menu positioned at the cursor.',
  },
  {
    slug: 'autocomplete',
    name: 'Autocomplete',
    domain: 'forms',
    description:
      'A text input with filtered, keyboard-navigable suggestions.',
  },
  {
    slug: 'color-picker',
    name: 'Color Picker',
    domain: 'forms',
    description:
      'A color input with a hex field, preset swatches, and a native color picker.',
  },
  {
    slug: 'file-upload',
    name: 'File Upload',
    domain: 'forms',
    description:
      'A drag-and-drop and click-to-browse file input with validation and a removable file list.',
  },
  {
    slug: 'input-number',
    name: 'Input Number',
    domain: 'forms',
    description:
      'A numeric spinner input with increment/decrement buttons, keyboard stepping, and min/max/step bounds.',
  },
  {
    slug: 'rating',
    name: 'Rating',
    domain: 'forms',
    description:
      'A star rating control with click, hover-preview, and keyboard support.',
  },
  {
    slug: 'splitter',
    name: 'Splitter',
    domain: 'panel',
    description:
      'A resizable multi-pane layout container with draggable dividers.',
  },
  {
    slug: 'toolbar',
    name: 'Toolbar',
    domain: 'panel',
    description: 'An action bar with start/center/end content-projection slots.',
  },
  {
    slug: 'scroll-top',
    name: 'Scroll Top',
    domain: 'overlay',
    description:
      'A floating button that scrolls to the top of the page after scrolling past a threshold.',
  },
  {
    slug: 'otp-input',
    name: 'OTP Input',
    domain: 'forms',
    description:
      'A segmented one-time-code input with auto-advance, backspace-to-previous, and paste support.',
  },
  {
    slug: 'timeline',
    name: 'Timeline',
    domain: 'panel',
    description:
      'A vertical event/activity list with markers, connecting lines, and per-item content projection.',
  },
  {
    slug: 'chips-input',
    name: 'Chips Input',
    domain: 'forms',
    description:
      'A tag/multi-value text input with Enter-to-commit, backspace-to-remove, and paste-splitting.',
  },
  {
    slug: 'tree-select',
    name: 'Tree Select',
    domain: 'forms',
    description:
      'A dropdown combobox whose panel shows a hierarchical, expandable tree.',
  },
  {
    slug: 'confirm-dialog',
    name: 'Confirm Dialog',
    domain: 'overlay',
    description:
      'An imperative confirm-before-action prompt — inject and call, resolves a Promise<boolean> on confirm/cancel.',
  },
  {
    slug: 'password',
    name: 'Password',
    domain: 'forms',
    description:
      'A masked text input with a show/hide toggle and an optional password-strength meter.',
  },
];
