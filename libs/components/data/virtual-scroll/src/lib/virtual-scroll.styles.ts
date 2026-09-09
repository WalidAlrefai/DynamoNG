// The only place Tailwind utility classes are allowed to live for this
// component — virtual-scroll.html only ever binds `[class]="...Classes()"`
// or a plain exported string constant. Border/rounding/background are left
// to the consumer via `styleClass` (this component owns only the
// overflow/scroll-behavior classes CDK's viewport itself needs).
export const virtualScrollViewportStyles = 'block overflow-y-auto';
