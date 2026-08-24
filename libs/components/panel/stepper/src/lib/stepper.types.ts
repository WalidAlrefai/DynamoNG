export type DynamoStepState = 'completed' | 'active' | 'upcoming';

export type DynamoStepperPart =
  | 'root'
  | 'nav'
  | 'step'
  | 'connector'
  | 'panel'
  | 'controls';
