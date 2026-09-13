import type { DynamoSize } from '@dynamong/core/api';

export type DynamoPaginationSize = DynamoSize;
export type DynamoPaginationPart =
  | 'root'
  | 'summary'
  | 'pageSizeSelect'
  | 'firstButton'
  | 'prevButton'
  | 'pageButton'
  | 'ellipsis'
  | 'nextButton'
  | 'lastButton';
