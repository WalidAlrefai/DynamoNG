export interface DynamoColorTokens {
  primary: string;
  primaryHover: string;
  onPrimary: string;
  secondary: string;
  secondaryHover: string;
  onSecondary: string;
  success: string;
  successHover: string;
  onSuccess: string;
  info: string;
  infoHover: string;
  onInfo: string;
  warning: string;
  warningHover: string;
  onWarning: string;
  danger: string;
  dangerHover: string;
  onDanger: string;
  surface0: string;
  surface50: string;
  surface100: string;
  surface200: string;
  /** Added so the 4 components already using `bg-surface-300`/`text-surface-300` resolve. */
  surface300: string;
  surface700: string;
  surface800: string;
  surface900: string;
  textPrimary: string;
  textMuted: string;
  /** Muted-further text for disabled controls (was a hardcoded `opacity-60` everywhere). */
  textDisabled: string;
  border: string;
  ring: string;
  /** Modal/drawer backdrop fill — carries alpha, so not a plain 6-digit hex. */
  scrim: string;
}

export interface DynamoRadiusTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface DynamoFocusTokens {
  ringWidth: string;
  ringOffset: string;
}

export interface DynamoSpacingTokens {
  /**
   * The single value Tailwind's entire spacing scale multiplies
   * (`--spacing`). Lowering it compacts every `p-*`/`gap-*`/`h-*`/`w-*`
   * utility at once — the white-label density knob.
   */
  unit: string;
}

export interface DynamoTypographyTokens {
  fontSans: string;
  fontMono: string;
  fontSizeXs: string;
  fontSizeSm: string;
  fontSizeBase: string;
  fontSizeLg: string;
  lineHeightXs: string;
  lineHeightSm: string;
  lineHeightBase: string;
  lineHeightLg: string;
  weightNormal: string;
  weightMedium: string;
  weightSemibold: string;
}

export interface DynamoElevationTokens {
  /** Resting lift — e.g. a switch thumb. */
  sm: string;
  /** Raised surface — e.g. an elevated card or panel. */
  md: string;
  /** Floating surface — every overlay panel (menu, dropdown, dialog, toast, …). */
  lg: string;
}

export interface DynamoMotionTokens {
  durationFast: string;
  durationBase: string;
  durationSlow: string;
  /** Decelerating curve for most enter/state transitions (≈ `ease-out`). */
  easeStandard: string;
  /** Symmetric curve for larger movements (≈ `ease-in-out`). */
  easeEmphasized: string;
}

export interface DynamoZIndexTokens {
  dropdown: string;
  overlayPanel: string;
  drawer: string;
  modal: string;
  popover: string;
  toast: string;
  tooltip: string;
}

export interface DynamoThemeTokens {
  color: DynamoColorTokens;
  radius: DynamoRadiusTokens;
  focus: DynamoFocusTokens;
  spacing: DynamoSpacingTokens;
  typography: DynamoTypographyTokens;
  elevation: DynamoElevationTokens;
  motion: DynamoMotionTokens;
  zIndex: DynamoZIndexTokens;
}

/** A partial token set used for overriding a subset of tokens, e.g. for a `.dark` variant. */
export type DynamoThemeTokensOverride = {
  [K in keyof DynamoThemeTokens]?: Partial<DynamoThemeTokens[K]>;
};
