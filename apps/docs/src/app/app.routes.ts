import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/home').then((m) => m.HomePage),
  },
  {
    path: 'components/button',
    loadComponent: () =>
      import('./pages/button-doc').then((m) => m.ButtonDocPage),
  },
  {
    path: 'components/checkbox',
    loadComponent: () =>
      import('./pages/checkbox-doc').then((m) => m.CheckboxDocPage),
  },
  {
    path: 'components/radio',
    loadComponent: () =>
      import('./pages/radio-doc').then((m) => m.RadioDocPage),
  },
  {
    path: 'components/switch',
    loadComponent: () =>
      import('./pages/switch-doc').then((m) => m.SwitchDocPage),
  },
  {
    path: 'components/input-text',
    loadComponent: () =>
      import('./pages/input-text-doc').then((m) => m.InputTextDocPage),
  },
  {
    path: 'components/textarea',
    loadComponent: () =>
      import('./pages/textarea-doc').then((m) => m.TextareaDocPage),
  },
  {
    path: 'components/select',
    loadComponent: () =>
      import('./pages/select-doc').then((m) => m.SelectDocPage),
  },
  {
    path: 'components/multi-select',
    loadComponent: () =>
      import('./pages/multi-select-doc').then((m) => m.MultiSelectDocPage),
  },
  {
    path: 'components/date-picker',
    loadComponent: () =>
      import('./pages/date-picker-doc').then((m) => m.DatePickerDocPage),
  },
  {
    path: 'components/pagination',
    loadComponent: () =>
      import('./pages/pagination-doc').then((m) => m.PaginationDocPage),
  },
  {
    path: 'components/dialog',
    loadComponent: () =>
      import('./pages/dialog-doc').then((m) => m.DialogDocPage),
  },
  {
    path: 'components/drawer',
    loadComponent: () =>
      import('./pages/drawer-doc').then((m) => m.DrawerDocPage),
  },
  {
    path: 'components/tooltip',
    loadComponent: () =>
      import('./pages/tooltip-doc').then((m) => m.TooltipDocPage),
  },
  {
    path: 'components/tabs',
    loadComponent: () => import('./pages/tabs-doc').then((m) => m.TabsDocPage),
  },
  {
    path: 'components/accordion',
    loadComponent: () =>
      import('./pages/accordion-doc').then((m) => m.AccordionDocPage),
  },
  {
    path: 'components/menu',
    loadComponent: () => import('./pages/menu-doc').then((m) => m.MenuDocPage),
  },
  {
    path: 'components/toast',
    loadComponent: () =>
      import('./pages/toast-doc').then((m) => m.ToastDocPage),
  },
  {
    path: 'components/badge',
    loadComponent: () =>
      import('./pages/badge-doc').then((m) => m.BadgeDocPage),
  },
  {
    path: 'components/card',
    loadComponent: () => import('./pages/card-doc').then((m) => m.CardDocPage),
  },
  {
    path: 'components/alert',
    loadComponent: () =>
      import('./pages/alert-doc').then((m) => m.AlertDocPage),
  },
  {
    path: 'components/chip',
    loadComponent: () => import('./pages/chip-doc').then((m) => m.ChipDocPage),
  },
  {
    path: 'components/table',
    loadComponent: () =>
      import('./pages/table-doc').then((m) => m.TableDocPage),
  },
  {
    path: 'components/spinner',
    loadComponent: () =>
      import('./pages/spinner-doc').then((m) => m.SpinnerDocPage),
  },
  {
    path: 'components/avatar',
    loadComponent: () =>
      import('./pages/avatar-doc').then((m) => m.AvatarDocPage),
  },
  {
    path: 'components/progress',
    loadComponent: () =>
      import('./pages/progress-doc').then((m) => m.ProgressDocPage),
  },
  {
    path: 'components/divider',
    loadComponent: () =>
      import('./pages/divider-doc').then((m) => m.DividerDocPage),
  },
  {
    path: 'components/tree',
    loadComponent: () => import('./pages/tree-doc').then((m) => m.TreeDocPage),
  },
  {
    path: 'components/stepper',
    loadComponent: () =>
      import('./pages/stepper-doc').then((m) => m.StepperDocPage),
  },
  {
    path: 'components/popover',
    loadComponent: () =>
      import('./pages/popover-doc').then((m) => m.PopoverDocPage),
  },
  {
    path: 'components/skeleton',
    loadComponent: () =>
      import('./pages/skeleton-doc').then((m) => m.SkeletonDocPage),
  },
  {
    path: 'components/tag',
    loadComponent: () => import('./pages/tag-doc').then((m) => m.TagDocPage),
  },
  {
    path: 'components/breadcrumb',
    loadComponent: () =>
      import('./pages/breadcrumb-doc').then((m) => m.BreadcrumbDocPage),
  },
  {
    path: 'components/carousel',
    loadComponent: () =>
      import('./pages/carousel-doc').then((m) => m.CarouselDocPage),
  },
  {
    path: 'components/slider',
    loadComponent: () =>
      import('./pages/slider-doc').then((m) => m.SliderDocPage),
  },
  {
    path: 'components/split-button',
    loadComponent: () =>
      import('./pages/split-button-doc').then((m) => m.SplitButtonDocPage),
  },
  {
    path: 'components/context-menu',
    loadComponent: () =>
      import('./pages/context-menu-doc').then((m) => m.ContextMenuDocPage),
  },
  {
    path: 'components/autocomplete',
    loadComponent: () =>
      import('./pages/autocomplete-doc').then((m) => m.AutocompleteDocPage),
  },
  {
    path: 'components/color-picker',
    loadComponent: () =>
      import('./pages/color-picker-doc').then((m) => m.ColorPickerDocPage),
  },
  {
    path: 'components/file-upload',
    loadComponent: () =>
      import('./pages/file-upload-doc').then((m) => m.FileUploadDocPage),
  },
  {
    path: 'components/input-number',
    loadComponent: () =>
      import('./pages/input-number-doc').then((m) => m.InputNumberDocPage),
  },
  {
    path: 'components/rating',
    loadComponent: () =>
      import('./pages/rating-doc').then((m) => m.RatingDocPage),
  },
  {
    path: 'components/splitter',
    loadComponent: () =>
      import('./pages/splitter-doc').then((m) => m.SplitterDocPage),
  },
  {
    path: 'components/toolbar',
    loadComponent: () =>
      import('./pages/toolbar-doc').then((m) => m.ToolbarDocPage),
  },
  {
    path: 'components/scroll-top',
    loadComponent: () =>
      import('./pages/scroll-top-doc').then((m) => m.ScrollTopDocPage),
  },
  {
    path: 'components/otp-input',
    loadComponent: () =>
      import('./pages/otp-input-doc').then((m) => m.OtpInputDocPage),
  },
  {
    path: 'components/timeline',
    loadComponent: () =>
      import('./pages/timeline-doc').then((m) => m.TimelineDocPage),
  },
  {
    path: 'components/chips-input',
    loadComponent: () =>
      import('./pages/chips-input-doc').then((m) => m.ChipsInputDocPage),
  },
  {
    path: 'components/tree-select',
    loadComponent: () =>
      import('./pages/tree-select-doc').then((m) => m.TreeSelectDocPage),
  },
  {
    path: 'components/confirm-dialog',
    loadComponent: () =>
      import('./pages/confirm-dialog-doc').then((m) => m.ConfirmDialogDocPage),
  },
  {
    path: 'components/password',
    loadComponent: () =>
      import('./pages/password-doc').then((m) => m.PasswordDocPage),
  },
];
