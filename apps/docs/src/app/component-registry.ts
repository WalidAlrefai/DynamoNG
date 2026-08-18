export interface DocComponentEntry {
  slug: string;
  name: string;
  domain: 'forms' | 'overlay';
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
    description: 'Triggers an action. Supports severity, size, variant, and a loading state.',
  },
  {
    slug: 'checkbox',
    name: 'Checkbox',
    domain: 'forms',
    description: 'A tri-state (checked / unchecked / indeterminate) toggle control.',
  },
  {
    slug: 'radio',
    name: 'Radio',
    domain: 'forms',
    description: 'A single-selection control among a group of native radio inputs sharing a name.',
  },
  {
    slug: 'input-text',
    name: 'Input Text',
    domain: 'forms',
    description: 'A single-line text input with full Angular Forms (ControlValueAccessor) integration.',
  },
  {
    slug: 'select',
    name: 'Select',
    domain: 'forms',
    description: 'A single-select combobox with full keyboard navigation and ARIA combobox semantics.',
  },
  {
    slug: 'dialog',
    name: 'Dialog',
    domain: 'overlay',
    description: 'A modal dialog with CDK-powered focus trapping and Escape/backdrop-to-close.',
  },
];
