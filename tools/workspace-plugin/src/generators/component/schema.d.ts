export interface ComponentGeneratorSchema {
  name: string;
  domain: 'forms' | 'overlay' | 'data' | 'panel' | 'menu';
  selector?: string;
  description?: string;
}
