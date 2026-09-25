import type { DynamoSize } from '@dynamong/core/api';

export type DynamoPaginationSize = DynamoSize;
export type DynamoPaginationPart =
  | 'root'
  | 'summary'
  | 'pageSizeSelect'
  | 'jump'
  | 'firstButton'
  | 'prevButton'
  | 'pageButton'
  | 'ellipsis'
  | 'nextButton'
  | 'lastButton';
