export interface ProcessorQuoteLine {
  id: string;
  [key: string]: any;
}

export interface ProductAttribute {
  field: string;
  activeValue: string | number | boolean;
  isDisabled?: boolean;
  allowedValues?: string[];
}

export interface RuleConditionHelpers {
  filterQuoteLines: (
    field: string,
    value: string | number | boolean
  ) => ProcessorQuoteLine[];
  applyQuoteConditions: (conditions: string) => boolean;
  applyQuoteLineConditions: (conditions: string) => ProcessorQuoteLine[];
  getAttributeValue: (field: string) => string | number | boolean;
  checkAttributeValue: (field: string, valueToCheck: any) => boolean;
}

export interface RuleActionHelpers {
  filterSourceQuotelines: (
    field: string,
    value: string | number | boolean
  ) => ProcessorQuoteLine[];
  filterTargetQuotelines: (
    field: string,
    value: string | number | boolean
  ) => ProcessorQuoteLine[];
  getAttributeIdx: (field: string) => number;
  getQuote: () => { [key: string]: any };
  getAttributes: () => ProductAttribute[];
}

export const keysToSkip: Set<string> = new Set([
  'quotekeys',
  'quotelinekeys',
  'productstoadd',
  'optionstoadd',
  'productstoremove',
  'validationmessages',
  'quotelines',
  'targetquotelines',
  'sourcequotelines',
  'rollupidTonamemap',
  'rollup',
  'rollupfieldsvalues',
  'lookuprecord',
]);
