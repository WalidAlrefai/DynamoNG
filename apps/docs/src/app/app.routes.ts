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
    path: 'components/date-picker',
    loadComponent: () =>
      import('./pages/date-picker-doc').then((m) => m.DatePickerDocPage),
  },
  {
    path: 'components/dialog',
    loadComponent: () =>
      import('./pages/dialog-doc').then((m) => m.DialogDocPage),
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
];
