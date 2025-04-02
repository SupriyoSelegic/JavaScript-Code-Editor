import { Injectable, signal } from '@angular/core';

import { RuleConditionProcessor } from '../processors/rule-condition-processor';
import { RuleActionProcessor } from '../processors/rule-action-processor';
import {
  ProcessorQuoteLine,
  ProductAttribute,
  RuleActionHelpers,
  RuleConditionHelpers,
} from '../types/rule-condition-processor.types';

@Injectable({
  providedIn: 'root',
})
export class HelpersService {
  private conditionProcessor: RuleConditionProcessor;
  private actionProcessor: RuleActionProcessor;
  // codeEditorTheme = signal<'Dark' | 'Light'>(null);
  // themeByCodeEditor: Map<String, String> = new Map<String, String>();
  themeByCodeEditor = signal(new Map<string, 'Dark' | 'Light'>());

  constructor() {
    // Initialize with default context
    this.conditionProcessor = new RuleConditionProcessor(
      'quote',
      {},
      {
        quoteLines: [],
        product: {},
        attributes: [],
        options: [],
      }
    );

    // this.themeByCodeEditor.set('condition', 'Dark');
    // this.themeByCodeEditor.set('action', 'Dark');

    this.themeByCodeEditor.update((prev) => {
      const newMap = new Map(prev); // Clone the existing Map
      newMap.set('condition', 'Dark'); // Update a value
      newMap.set('action', 'Dark'); // Update a value
      return newMap; // Return the updated Map
    });
  }

  readonly customConditionHelpers: RuleConditionHelpers & {
    // Standard helpers
    sum: (...args: number[]) => number;
    multiply: (...args: number[]) => number;
    average: (...args: number[]) => number;
    capitalize: (str: string) => string;
    reverse: (str: string) => string;

    // Rule processor helpers
    filterQuoteLines: (
      field: string,
      value: string | number | boolean
    ) => ProcessorQuoteLine[];
    applyQuoteConditions: (conditions: string) => boolean;
    applyQuoteLineConditions: (conditions: string) => ProcessorQuoteLine[];
    getAttributeValue: (field: string) => string | number | boolean;
    checkAttributeValue: (field: string, valueToCheck: any) => boolean;
  } = {
    // Standard helpers
    sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
    multiply: (...args: number[]) => args.reduce((a, b) => a * b, 1),
    average: (...args: number[]) =>
      args.reduce((a, b) => a + b, 0) / args.length,
    capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
    reverse: (str: string) => str.split('').reverse().join(''),

    // Rule condition processor helpers
    filterQuoteLines: (field: string, value: string | number | boolean) =>
      this.conditionProcessor.filterQuoteLines(field, value),
    applyQuoteConditions: (conditions: string) =>
      this.conditionProcessor.applyQuoteConditions(conditions),
    applyQuoteLineConditions: (conditions: string) =>
      this.conditionProcessor.applyQuoteLineConditions(conditions),
    getAttributeValue: (field: string) =>
      this.conditionProcessor.getAttributeValue(field),
    checkAttributeValue: (field: string, valueToCheck: any) =>
      this.conditionProcessor.checkAttributeValue(field, valueToCheck),
  };

  readonly customActionHelpers: RuleActionHelpers & {
    // Standard helpers
    sum: (...args: number[]) => number;
    multiply: (...args: number[]) => number;
    average: (...args: number[]) => number;
    capitalize: (str: string) => string;
    reverse: (str: string) => string;

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
  } = {
    // Standard helpers
    sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
    multiply: (...args: number[]) => args.reduce((a, b) => a * b, 1),
    average: (...args: number[]) =>
      args.reduce((a, b) => a + b, 0) / args.length,
    capitalize: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
    reverse: (str: string) => str.split('').reverse().join(''),

    // Rule action processor helpers
    filterSourceQuotelines: (field: string, value: string | number | boolean) =>
      this.actionProcessor.filterSourceQuotelines(field, value),
    filterTargetQuotelines: (field: string, value: string | number | boolean) =>
      this.actionProcessor.filterTargetQuotelines(field, value),
    getAttributeIdx: (field: string) =>
      this.actionProcessor.getAttributeIdx(field),
    getQuote: () => this.actionProcessor.getQuote(),
    getAttributes: () => this.actionProcessor.getAttributes(),
  };

  getConditionHelperDocs(
    helper: keyof typeof this.customConditionHelpers
  ): string {
    const docs: Record<string, string> = {
      // Standard helper docs
      sum: 'Adds all provided numbers',
      multiply: 'Multiplies all provided numbers',
      average: 'Calculates average of provided numbers',
      capitalize: 'Capitalizes first letter of string',
      reverse: 'Reverses a string',

      // Rule condition processor helper docs
      filterQuoteLines: 'Filter quote lines by field and value',
      applyQuoteConditions: 'Apply conditions to the quote',
      applyQuoteLineConditions: 'Apply conditions to quote lines',
      getAttributeValue: 'Get value of a product attribute',
      checkAttributeValue: 'Check if attribute matches a value',
    };
    return docs[helper] || 'No documentation available';
  }

  getActionHelperDocs(helper: keyof typeof this.customActionHelpers): string {
    const docs: Record<string, string> = {
      // Standard helper docs
      sum: 'Adds all provided numbers',
      multiply: 'Multiplies all provided numbers',
      average: 'Calculates average of provided numbers',
      capitalize: 'Capitalizes first letter of string',
      reverse: 'Reverses a string',

      // Rule action processor helper docs
      filterSourceQuotelines: 'Filter source quote lines by field and value',
      filterTargetQuotelines: 'Filter target quote lines by field and value',
      getAttributeIdx: 'Get attribute index number by field',
      getQuote: 'Get quote details',
      getAttributes: 'Get attributes details',
    };
    return docs[helper] || 'No documentation available';
  }

  // Method to update processor context
  updateContext(quote: any, data: any) {
    this.conditionProcessor = new RuleConditionProcessor('quote', quote, data);
  }
}
