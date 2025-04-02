import {
  ProcessorQuoteLine,
  ProductAttribute,
} from '../types/rule-condition-processor.types';

export class RuleConditionProcessor {
  get() {
    return this;
  }

  [key: string]: any;
  private quoteKeys: string[] = [];

  recentevaluationresult: {
    isSatisfied: boolean;
    satisfiedLines?: ProcessorQuoteLine[];
  };

  private quoteLines: ProcessorQuoteLine[];
  getQuoteLines() {
    return Array.isArray(this.quoteLines) ? this.quoteLines : [];
  }
  setQuoteLines(lines: ProcessorQuoteLine[]) {
    if (Array.isArray(lines)) {
      this.quoteLines = lines;
    } else {
      this.quoteLines = [];
    }
  }

  private rollup: { [key: string]: number } = {}; // { [name]/[id] : [value] }
  setRollupResult(values: { [key: string]: number }) {
    for (let key of Object.keys(values)) {
      this.rollup[key] = values[key];
    }
  }
  getRollupFieldValue(rollupFieldId: string): number {
    return this.rollup[rollupFieldId];
  }

  private idtoLineMap = new Map<string, ProcessorQuoteLine>();

  product?: { [key: string]: any };
  private attributes?: ProductAttribute[];
  getAttributes() {
    return this.attributes;
  }
  options?: { [key: string]: any }[];
  productAttributeValue?: { [key: string]: any };

  constructor(
    context: 'quote' | 'product',
    quote: { [key: string]: any },
    data: {
      quoteLines?: ProcessorQuoteLine[];
      product?: { [key: string]: any };
      attributes?: ProductAttribute[];
      options?: { [key: string]: any }[];
      productAttributeValue?: { [key: string]: any };
    }
  ) {
    Object.assign(this, quote);
    this.quoteKeys = Object.keys(quote);

    if (context === 'quote') {
      const { quoteLines } = data;
      // quote lines
      if (Array.isArray(quoteLines) && quoteLines.length) {
        this.quoteLines = quoteLines;
        for (let line of quoteLines) {
          this.idtoLineMap.set(line['id'] as string, line);
        }
      } else {
        this.quoteLines = [];
      }

      this.product = {};
      this.options = [];
      this.attributes = [];
    }

    if (context === 'product') {
      const { product, attributes, options } = data;
      this.product = product ?? {};
      this.options = options ?? [];
      this.attributes = attributes ?? [];
      this.productAttributeValue = this.productAttributeValue ?? {};

      this.quoteLines = [];
    }
  }

  getQuote(): { [key: string]: any } {
    const quote: { [key: string]: any } = {};
    for (let key of this.quoteKeys) {
      quote[key] = this?.[key];
    }
    return quote;
  }

  filterQuoteLines(
    field: string,
    value: string | number | boolean
  ): ProcessorQuoteLine[] {
    return this.quoteLines.filter((line) => line[field] == value);
  }

  applyQuoteConditions(conditions: string): boolean {
    if (!conditions) {
      this.recentevaluationresult = { isSatisfied: false };
    }

    const structuredconditions = this.structureConditions(conditions, 'this');

    let isSatisfied: boolean;
    try {
      isSatisfied = Boolean(structuredconditions);
    } catch (error) {
      isSatisfied = false;
    }
    this.recentevaluationresult = { isSatisfied };
    if (isSatisfied) {
      this.recentevaluationresult.satisfiedLines = Array.from(
        this.idtoLineMap.values()
      );
    }
    return isSatisfied;
  }

  applyQuoteLineConditions(conditions: string): ProcessorQuoteLine[] {
    if (!conditions) {
      this.recentevaluationresult = { isSatisfied: true };
    }
    const structuredconditions = this.structureConditions(
      conditions,
      'quoteline'
    );
    const satisfiedquoteLines = this.quoteLines.filter(
      (quoteline: ProcessorQuoteLine) => {
        try {
          return new Function('quoteline', `return ${structuredconditions}`)(
            quoteline
          );
        } catch (error) {
          console.log('error: ', error);
          return false;
        }
      }
    );
    this.recentevaluationresult = {
      isSatisfied: satisfiedquoteLines?.length > 0,
      satisfiedLines: satisfiedquoteLines,
    };
    return satisfiedquoteLines;
  }

  private structureConditions(conditions: string, prefix: string) {
    // Preprocess the condition to ensure proper spacing
    let spacedconditions = conditions
      .replace(/\(/g, ' ( ')
      .replace(/\)/g, ' ) ')
      .replace(/(?<!=)=(?!=)/g, ' == ') // Replace '=' with '==' where it's used as a comparison
      .replace(/\s*==\s*/g, ' == ') // Normalize spacing around ==
      .replace(/>/g, ' > ')
      .replace(/</g, ' < ')
      .replace(/>=/g, ' >= ')
      .replace(/<=/g, ' <= ')
      .replace(/!=/g, ' != ')
      .replace(/\b(and)\b/gi, ' && ')
      .replace(/\b(or)\b/gi, ' || ');

    // Split the condition into tokens, keeping parentheses
    let tokens = spacedconditions.split(/\s+/).filter(Boolean);

    const formattedtokens = tokens.map((token, idx) => {
      const next = tokens[idx + 1];

      // Check if token is a field reference that needs prefixing
      if (
        token !== '(' &&
        token !== ')' && // Not a parenthesis
        !['===', '==', '!=', '>', '<', '>=', '<=', '&&', '||'].includes(
          token
        ) && // Not an operator
        next &&
        ['===', '==', '!=', '>', '<', '>=', '<='].includes(next) // Followed by a comparison
      ) {
        return `${prefix}.${token}`;
      }

      return token;
    });

    return formattedtokens.join(' ').replace(/\s+/g, ' ').trim();
  }

  getAttributeValue(field: string): string | number | boolean {
    return this.attributes.find(
      (attr) => attr.field.toLowerCase() === field.toLowerCase()
    )?.activeValue;
  }

  checkAttributeValue(field: string, valueToCheck: any): boolean {
    return (
      this.attributes.find(
        (attr) => attr.field.toLowerCase() === field.toLowerCase()
      )?.activeValue == valueToCheck
    );
  }
}
