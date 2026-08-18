import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — tabs.html only ever binds `[class]="...Classes()"`.
export const tabsRootStyles = 'flex flex-col gap-2';
export const tabsTablistStyles =
  'flex items-center gap-1 border-b border-border';
export const tabsPanelStyles =
  'pt-4 text-text-primary focus-visible:outline-none';

export const tabsTabStyles = cva(
  '-mb-px inline-flex items-center gap-2 whitespace-nowrap rounded-t-md border-b-2 px-4 py-2 ' +
    'text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      active: {
        true: 'border-primary text-primary',
        false: 'border-transparent text-text-muted hover:text-text-primary',
      },
      disabled: {
        true: 'pointer-events-none cursor-not-allowed opacity-60',
        false: 'cursor-pointer',
      },
    },
    defaultVariants: { active: false, disabled: false },
  },
);
