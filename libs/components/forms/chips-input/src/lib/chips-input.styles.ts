import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — chips-input.html only ever binds `[class]="...Classes()"`.
//
// Mirrors colorPickerWrapperStyles' shape (bordered flex wrapper hosting a
// plain text field alongside other content).
export const chipsInputWrapperStyles = cva(
  'flex w-full flex-wrap items-center gap-1.5 rounded-md border bg-surface-0 ' +
    'transition-colors focus-within:ring-2 focus-within:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'min-h-8 px-2 py-1 text-sm',
        md: 'min-h-10 px-3 py-1.5 text-base',
        lg: 'min-h-12 px-4 py-2 text-lg',
      },
      invalid: {
        true: 'border-danger focus-within:ring-danger',
        false: 'border-border focus-within:ring-ring',
      },
      disabled: {
        true: 'pointer-events-none opacity-60',
        false: '',
      },
    },
    defaultVariants: { size: 'md', invalid: false, disabled: false },
  },
);

// Mirrors DynamoChip's look (`chip.styles.ts` isn't exported from
// `@dynamong/chip`'s public entry, so this is a local, small redeclaration,
// not an import — same situation as InputNumber mirroring InputText).
export const chipsInputChipStyles = cva(
  'inline-flex items-center gap-1 rounded-full bg-surface-200 text-text-primary',
  {
    variants: {
      size: {
        sm: 'px-1.5 py-0.5 text-xs',
        md: 'px-2 py-0.5 text-sm',
        lg: 'px-2.5 py-1 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export const chipsInputRemoveButtonStyles =
  '-mr-0.5 inline-flex shrink-0 items-center justify-center rounded-full p-0.5 ' +
  'transition-colors hover:bg-surface-300 focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-ring disabled:cursor-not-allowed';

export const chipsInputFieldStyles =
  'min-w-[6ch] flex-1 border-none bg-transparent outline-none disabled:cursor-not-allowed';
