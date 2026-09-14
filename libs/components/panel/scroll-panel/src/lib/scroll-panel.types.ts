export type DynamoScrollPanelPart =
  'root' | 'content' | 'trackY' | 'trackX' | 'thumbY' | 'thumbX';

/** Live scroll/size metrics read directly off the viewport element; drives both thumbs' visibility, size, and position. */
export interface DynamoScrollPanelMetrics {
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  clientHeight: number;
  scrollWidth: number;
  clientWidth: number;
}
