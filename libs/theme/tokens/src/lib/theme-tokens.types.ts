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
  surface700: string;
  surface800: string;
  surface900: string;
  textPrimary: string;
  textMuted: string;
  border: string;
  ring: string;
}

export interface DynamoRadiusTokens {
  sm: string;
  md: string;
  lg: string;
  full: string;
}

export interface DynamoFocusTokens {
  ringWidth: string;
  ringOffset: string;
}

export interface DynamoThemeTokens {
  color: DynamoColorTokens;
  radius: DynamoRadiusTokens;
  focus: DynamoFocusTokens;
}

/** A partial token set used for overriding a subset of tokens, e.g. for a `.dark` variant. */
export type DynamoThemeTokensOverride = {
  [K in keyof DynamoThemeTokens]?: Partial<DynamoThemeTokens[K]>;
};
