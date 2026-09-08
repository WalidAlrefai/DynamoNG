export interface DocComponentEntry {
  slug: string;
  name: string;
  domain: 'forms' | 'overlay' | 'panel' | 'feedback' | 'data';
  /**
   * PrimeNG-style sidebar/nav grouping — independent of `domain` (which
   * predates this and stays purely a source-folder/project-tag concern per
   * the root README). Only categories with at least one member are ever
   * rendered, so this union can safely grow without every value being used.
   */
  category:
    | 'Form'
    | 'Button'
    | 'Data'
    | 'Panel'
    | 'Overlay'
    | 'Menu'
    | 'Messages'
    | 'Media'
    | 'Misc';
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
    category: 'Button',
    description:
      'Triggers an action. Supports severity, size, variant, and a loading state.',
  },
  {
    slug: 'checkbox',
    name: 'Checkbox',
    domain: 'forms',
    category: 'Form',
    description:
      'A tri-state (checked / unchecked / indeterminate) toggle control.',
  },
  {
    slug: 'radio',
    name: 'Radio',
    domain: 'forms',
    category: 'Form',
    description:
      'A single-selection control among a group of native radio inputs sharing a name.',
  },
  {
    slug: 'switch',
    name: 'Switch',
    domain: 'forms',
    category: 'Form',
    description: 'A boolean on/off toggle control.',
  },
  {
    slug: 'input-text',
    name: 'Input Text',
    domain: 'forms',
    category: 'Form',
    description:
      'A single-line text input with full Angular Forms (ControlValueAccessor) integration.',
  },
  {
    slug: 'textarea',
    name: 'Textarea',
    domain: 'forms',
    category: 'Form',
    description:
      'A multi-line text input with full Angular Forms (ControlValueAccessor) integration and optional auto-resize.',
  },
  {
    slug: 'select',
    name: 'Select',
    domain: 'forms',
    category: 'Form',
    description:
      'A single-select combobox with full keyboard navigation, ARIA combobox semantics, and optional filtering.',
  },
  {
    slug: 'multi-select',
    name: 'Multi Select',
    domain: 'forms',
    category: 'Form',
    description:
      'A multi-select combobox with tag display, filtering, a header select-all/clear-all checkbox, a max-selection cap, and option grouping.',
  },
  {
    slug: 'date-picker',
    name: 'Date Picker',
    domain: 'forms',
    category: 'Form',
    description:
      'A single-date picker with a month-grid calendar dialog, full keyboard navigation, and ARIA grid semantics.',
  },
  {
    slug: 'pagination',
    name: 'Pagination',
    domain: 'forms',
    category: 'Data',
    description:
      'A pagination control with windowed page-number navigation, ellipsis truncation, and a rows-per-page selector, built from DynamoButton and DynamoSelect.',
  },
  {
    slug: 'dialog',
    name: 'Dialog',
    domain: 'overlay',
    category: 'Overlay',
    description:
      'A modal dialog with CDK-powered focus trapping and Escape/backdrop-to-close.',
  },
  {
    slug: 'drawer',
    name: 'Drawer',
    domain: 'overlay',
    category: 'Overlay',
    description:
      'An off-canvas panel that slides in from a screen edge, with CDK-powered focus trapping and Escape/backdrop-to-close.',
  },
  {
    slug: 'tooltip',
    name: 'Tooltip',
    domain: 'overlay',
    category: 'Overlay',
    description:
      'A hover/focus-triggered hint positioned by CDK Overlay with viewport-collision flipping.',
  },
  {
    slug: 'tabs',
    name: 'Tabs',
    domain: 'panel',
    category: 'Panel',
    description:
      'A tabbed content switcher with full keyboard navigation and ARIA tabs semantics.',
  },
  {
    slug: 'accordion',
    name: 'Accordion',
    domain: 'panel',
    category: 'Panel',
    description:
      'A collapsible content switcher with full keyboard navigation and ARIA accordion semantics.',
  },
  {
    slug: 'menu',
    name: 'Menu',
    domain: 'overlay',
    category: 'Menu',
    description:
      'A dropdown action menu positioned by CDK Overlay, with full keyboard navigation and ARIA menu semantics.',
  },
  {
    slug: 'toast',
    name: 'Toast',
    domain: 'feedback',
    category: 'Messages',
    description:
      'A global, imperative notification service — inject and call, no template tag required.',
  },
  {
    slug: 'badge',
    name: 'Badge',
    domain: 'feedback',
    category: 'Messages',
    description: 'A small, severity-colored label for status or metadata.',
  },
  {
    slug: 'card',
    name: 'Card',
    domain: 'panel',
    category: 'Panel',
    description:
      'A content container with an optional header, body, and footer.',
  },
  {
    slug: 'alert',
    name: 'Alert',
    domain: 'feedback',
    category: 'Messages',
    description:
      'A persistent, severity-colored in-page status message, optionally closable.',
  },
  {
    slug: 'chip',
    name: 'Chip',
    domain: 'feedback',
    category: 'Misc',
    description: 'A compact, optionally-removable label.',
  },
  {
    slug: 'table',
    name: 'Table',
    domain: 'data',
    category: 'Data',
    description:
      'A data table driven by a plain column-definition array, with client-side single-column sorting, pagination, row selection, global filtering, and per-column cell-template projection.',
  },
  {
    slug: 'spinner',
    name: 'Spinner',
    domain: 'feedback',
    category: 'Misc',
    description:
      'A small loading indicator — decorative by default, or an announced status region when given a label.',
  },
  {
    slug: 'avatar',
    name: 'Avatar',
    domain: 'data',
    category: 'Misc',
    description:
      'A user image with initials/icon fallback, for user-related data displays like table rows.',
  },
  {
    slug: 'progress',
    name: 'Progress',
    domain: 'feedback',
    category: 'Misc',
    description:
      'A determinate linear progress bar with severity-colored fill.',
  },
  {
    slug: 'divider',
    name: 'Divider',
    domain: 'panel',
    category: 'Panel',
    description:
      'A horizontal or vertical rule, optionally with a centered label.',
  },
  {
    slug: 'tree',
    name: 'Tree',
    domain: 'data',
    category: 'Data',
    description:
      'A hierarchical, expandable tree with keyboard navigation and multi-select tri-state checkboxes.',
  },
  {
    slug: 'stepper',
    name: 'Stepper',
    domain: 'panel',
    category: 'Panel',
    description:
      'A multi-step process indicator with built-in content panels and Back/Next navigation.',
  },
  {
    slug: 'popover',
    name: 'Popover',
    domain: 'overlay',
    category: 'Overlay',
    description:
      'A generic floating panel with arbitrary projected content, positioned relative to a trigger.',
  },
  {
    slug: 'skeleton',
    name: 'Skeleton',
    domain: 'feedback',
    category: 'Misc',
    description: 'An animated loading-placeholder block.',
  },
  {
    slug: 'tag',
    name: 'Tag',
    domain: 'feedback',
    category: 'Misc',
    description: 'A static, non-removable severity-colored label.',
  },
  {
    slug: 'breadcrumb',
    name: 'Breadcrumb',
    domain: 'panel',
    category: 'Menu',
    description: 'A path navigation trail with a current-page indicator.',
  },
  {
    slug: 'carousel',
    name: 'Carousel',
    domain: 'panel',
    category: 'Media',
    description:
      'A sliding content carousel with swipe, keyboard, and autoplay navigation.',
  },
  {
    slug: 'slider',
    name: 'Slider',
    domain: 'forms',
    category: 'Form',
    description:
      'A draggable range input with keyboard stepping and click-to-jump.',
  },
  {
    slug: 'split-button',
    name: 'Split Button',
    domain: 'forms',
    category: 'Button',
    description:
      'A primary action button with an attached dropdown of secondary actions.',
  },
  {
    slug: 'context-menu',
    name: 'Context Menu',
    domain: 'overlay',
    category: 'Menu',
    description: 'A right-click triggered menu positioned at the cursor.',
  },
  {
    slug: 'autocomplete',
    name: 'Autocomplete',
    domain: 'forms',
    category: 'Form',
    description:
      'A text input with filtered, keyboard-navigable suggestions.',
  },
  {
    slug: 'color-picker',
    name: 'Color Picker',
    domain: 'forms',
    category: 'Form',
    description:
      'A color input with a hex field, preset swatches, and a native color picker.',
  },
  {
    slug: 'file-upload',
    name: 'File Upload',
    domain: 'forms',
    category: 'Form',
    description:
      'A drag-and-drop and click-to-browse file input with validation and a removable file list.',
  },
  {
    slug: 'input-number',
    name: 'Input Number',
    domain: 'forms',
    category: 'Form',
    description:
      'A numeric spinner input with increment/decrement buttons, keyboard stepping, and min/max/step bounds.',
  },
  {
    slug: 'rating',
    name: 'Rating',
    domain: 'forms',
    category: 'Form',
    description:
      'A star rating control with click, hover-preview, and keyboard support.',
  },
  {
    slug: 'splitter',
    name: 'Splitter',
    domain: 'panel',
    category: 'Panel',
    description:
      'A resizable multi-pane layout container with draggable dividers.',
  },
  {
    slug: 'toolbar',
    name: 'Toolbar',
    domain: 'panel',
    category: 'Panel',
    description: 'An action bar with start/center/end content-projection slots.',
  },
  {
    slug: 'scroll-top',
    name: 'Scroll Top',
    domain: 'overlay',
    category: 'Misc',
    description:
      'A floating button that scrolls to the top of the page after scrolling past a threshold.',
  },
  {
    slug: 'otp-input',
    name: 'OTP Input',
    domain: 'forms',
    category: 'Form',
    description:
      'A segmented one-time-code input with auto-advance, backspace-to-previous, and paste support.',
  },
  {
    slug: 'timeline',
    name: 'Timeline',
    domain: 'panel',
    category: 'Data',
    description:
      'A vertical event/activity list with markers, connecting lines, and per-item content projection.',
  },
  {
    slug: 'chips-input',
    name: 'Chips Input',
    domain: 'forms',
    category: 'Form',
    description:
      'A tag/multi-value text input with Enter-to-commit, backspace-to-remove, and paste-splitting.',
  },
  {
    slug: 'tree-select',
    name: 'Tree Select',
    domain: 'forms',
    category: 'Form',
    description:
      'A dropdown combobox whose panel shows a hierarchical, expandable tree.',
  },
  {
    slug: 'confirm-dialog',
    name: 'Confirm Dialog',
    domain: 'overlay',
    category: 'Overlay',
    description:
      'An imperative confirm-before-action prompt — inject and call, resolves a Promise<boolean> on confirm/cancel.',
  },
  {
    slug: 'password',
    name: 'Password',
    domain: 'forms',
    category: 'Form',
    description:
      'A masked text input with a show/hide toggle and an optional password-strength meter.',
  },
  {
    slug: 'select-button',
    name: 'Select Button',
    domain: 'forms',
    category: 'Button',
    description:
      'A segmented row of buttons acting as a single- or multi-select control.',
  },
  {
    slug: 'toggle-button',
    name: 'Toggle Button',
    domain: 'forms',
    category: 'Button',
    description:
      'A single pressable button with a pressed/unpressed visual state.',
  },
  {
    slug: 'listbox',
    name: 'Listbox',
    domain: 'forms',
    category: 'Form',
    description:
      'An always-visible, single- or multi-select option list — no trigger, no overlay.',
  },
  {
    slug: 'cascade-select',
    name: 'Cascade Select',
    domain: 'forms',
    category: 'Form',
    description:
      'A multi-level dependent dropdown — selecting a branch reveals its children in a side flyout, down to a leaf.',
  },
  {
    slug: 'knob',
    name: 'Knob',
    domain: 'forms',
    category: 'Form',
    description:
      'A circular dial input adjustable by drag, scroll, or keyboard.',
  },
  {
    slug: 'input-mask',
    name: 'Input Mask',
    domain: 'forms',
    category: 'Form',
    description:
      'A masked text input that enforces a fixed character pattern as the user types, auto-inserting literals and skipping them on backspace/delete.',
  },
  {
    slug: 'picklist',
    name: 'PickList',
    domain: 'forms',
    category: 'Form',
    description:
      'A dual-list transfer widget — move items between an available and a selected list via buttons, drag-and-drop, or keyboard reorder controls.',
  },
  {
    slug: 'editor',
    name: 'Editor',
    domain: 'forms',
    category: 'Form',
    description:
      'A contenteditable rich-text editor with a formatting toolbar for bold, italic, underline, lists, and links.',
  },
  {
    slug: 'image-gallery',
    name: 'Image Gallery',
    domain: 'panel',
    category: 'Media',
    description:
      'An image viewer with a thumbnail strip and a fullscreen lightbox, with full keyboard navigation.',
  },
  {
    slug: 'panel',
    name: 'Panel',
    domain: 'panel',
    category: 'Panel',
    description:
      'A single standalone collapsible content section with its own header.',
  },
  {
    slug: 'fieldset',
    name: 'Fieldset',
    domain: 'forms',
    category: 'Form',
    description:
      'A bordered, legend\'d form section built on the native <fieldset>/<legend> elements, optionally collapsible.',
  },
  {
    slug: 'input-group',
    name: 'Input Group',
    domain: 'forms',
    category: 'Form',
    description:
      'A bordered wrapper adding prefix/suffix content — an icon, a $ sign, a unit label — alongside any projected input.',
  },
];
