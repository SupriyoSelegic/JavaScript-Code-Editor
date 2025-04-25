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

    this.themeByCodeEditor.update((prev) => {
      const newMap = new Map(prev);
      newMap.set('condition', 'Dark');
      newMap.set('action', 'Dark');
      return newMap;
    });
  }

  readonly customConditionHelpers = {
    quote: {
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
    },
  } as const;

  readonly customActionHelpers = {
    quote: {
      filterSourceQuotelines: (
        field: string,
        value: string | number | boolean
      ) => this.actionProcessor.filterSourceQuotelines(field, value),

      filterTargetQuotelines: (
        field: string,
        value: string | number | boolean
      ) => this.actionProcessor.filterTargetQuotelines(field, value),

      getAttributeIdx: (field: string) =>
        this.actionProcessor.getAttributeIdx(field),

      getQuote: () => this.actionProcessor.getQuote(),

      getAttributes: () => this.actionProcessor.getAttributes(),
    },
  } as const;

  getConditionHelperDocs(
    helper: keyof typeof this.customConditionHelpers.quote
  ): string {
    const docs: Record<keyof typeof this.customConditionHelpers.quote, string> =
      {
        filterQuoteLines: 'Filter quote lines by field and value',
        applyQuoteConditions: 'Apply conditions to the quote',
        applyQuoteLineConditions: 'Apply conditions to quote lines',
        getAttributeValue: 'Get value of a product attribute',
        checkAttributeValue: 'Check if attribute matches a value',
      };

    return docs[helper] || 'No documentation available';
  }

  getActionHelperDocs(
    helper: keyof typeof this.customActionHelpers.quote
  ): string {
    const docs: Record<keyof typeof this.customActionHelpers.quote, string> = {
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
