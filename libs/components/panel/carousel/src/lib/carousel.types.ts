export type DynamoCarouselPart =
  'root' | 'viewport' | 'track' | 'slide' | 'arrow' | 'indicators' | 'dot';

/** Overrides `numVisible`/`numScroll` at or below a given viewport width (px). When several entries match, the narrowest (smallest `breakpoint`) wins. */
export interface DynamoCarouselResponsiveOption {
  breakpoint: number;
  numVisible: number;
  numScroll: number;
}
