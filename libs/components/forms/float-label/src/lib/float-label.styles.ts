import { cva } from 'class-variance-authority';

// The only place Tailwind utility classes are allowed to live for this
// component — the templates only bind `[class]="...Classes()"`.
//
// The float behaviour is pure CSS: the root `<label>` is a `.group`, and the
// text `<span>` reacts to the *projected* control via `group-has-*` variants.
// The filled check MUST scope `:not(:placeholder-shown)` to real form fields
// (`:is(input,textarea)`) — any non-field descendant (the label span itself,
// wrapper divs) trivially satisfies a bare `:not(:placeholder-shown)`, which
// would keep the label permanently floated. The projected control also needs
// a `placeholder` (a single space is fine) for `:placeholder-shown` to
// resolve, exactly like PrimeNG's FloatLabel.

export const floatLabelRootStyles = 'group relative block';

// At rest the label sits vertically centred over the field. Once floated
// (on focus or when the field is filled) it shrinks, straightens its
// translate, and takes the primary colour; each `variant` supplies its own
// floated `top` so there is never a conflicting `top-*` in the cascade.
const FLOATED_SHARED =
  'group-has-[:focus]:translate-y-0 group-has-[:focus]:text-xs group-has-[:focus]:text-primary ' +
  'group-has-[:is(input,textarea):not(:placeholder-shown)]:translate-y-0 ' +
  'group-has-[:is(input,textarea):not(:placeholder-shown)]:text-xs';

export const floatLabelTextStyles = cva(
  'pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 origin-left rtl:origin-right ' +
    'text-sm text-text-muted transition-all duration-200 ease-out ' +
    FLOATED_SHARED,
  {
    variants: {
      variant: {
        // `over` lifts the label onto the top border with a background chip.
        over:
          'group-has-[:focus]:-top-2 group-has-[:focus]:bg-surface-0 group-has-[:focus]:px-1 ' +
          'group-has-[:is(input,textarea):not(:placeholder-shown)]:-top-2 ' +
          'group-has-[:is(input,textarea):not(:placeholder-shown)]:bg-surface-0 ' +
          'group-has-[:is(input,textarea):not(:placeholder-shown)]:px-1',
        // `in` keeps the floated label inside the field's top padding.
        in:
          'group-has-[:focus]:top-1 ' +
          'group-has-[:is(input,textarea):not(:placeholder-shown)]:top-1',
        // `on` sits the floated label on the border with a background chip.
        on:
          'group-has-[:focus]:-top-2 group-has-[:focus]:bg-surface-0 group-has-[:focus]:px-1 ' +
          'group-has-[:is(input,textarea):not(:placeholder-shown)]:-top-2 ' +
          'group-has-[:is(input,textarea):not(:placeholder-shown)]:bg-surface-0 ' +
          'group-has-[:is(input,textarea):not(:placeholder-shown)]:px-1',
      },
    },
    defaultVariants: { variant: 'over' },
  },
);

// IftaLabel: the label is pinned to the top-inside of the field and always
// visible; the field itself gets extra top padding so its value clears the
// label. `[&_:is(input,textarea,select)]` reaches the projected control.
export const iftaLabelRootStyles =
  'relative block [&_:is(input,textarea,select)]:pt-5 [&_:is(input,textarea,select)]:pb-1';

export const iftaLabelTextStyles =
  'pointer-events-none absolute start-3 top-1 text-xs font-medium text-text-muted';
