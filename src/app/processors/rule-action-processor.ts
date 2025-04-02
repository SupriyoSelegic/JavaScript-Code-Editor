import {
  ProcessorQuoteLine,
  ProductAttribute,
  keysToSkip,
} from '../types/rule-condition-processor.types';
// import { keysToSkip } from './rule.utils';

export class RuleActionProcessor {
  get() {
    return this;
  }

  [key: string]: any;
  private quotekeys: string[] = [];

  private productlookupfield: string;
  setProductLookupField(field: string) {
    this.productlookupfield = field;
  }

  private productstoadd: { product: string; quantity: number }[] = [];
  setProductsToAdd(data: { product: string; quantity: number }[]) {
    this.productstoadd = data;
  }
  getProductsToAdd() {
    return this.productstoadd;
  }

  optionstoadd: {
    bundleproduct: string;
    bundleproductid: string;
    optionproduct: string;
    optionquantity: number;
  }[] = [];
  setOptionsToAdd(
    data: {
      bundleproduct: string;
      bundleproductid: string;
      optionproduct: string;
      optionquantity: number;
    }[]
  ) {
    this.optionstoadd = data;
  }
  getOptionsToAdd() {
    return this.optionstoadd;
  }

  private productstoremove: string[] = [];
  setProductsToRemove(data: string[]) {
    this.productstoremove = data;
  }
  getProductsToRemove() {
    return this.productstoremove;
  }

  private validationmessages: {
    message: string;
    type: string;
  }[] = [];
  setValidationMessages(data: { message: string; type: string }[]) {
    this.validationmessages = data;
  }
  getValidationMessages() {
    return this.validationmessages;
  }

  recentevaluationresult: {
    issatisfied: boolean;
    satisfiedquotelines?: ProcessorQuoteLine[];
  };

  targetquotelines: ProcessorQuoteLine[];
  getTargetQuotelines() {
    return Array.isArray(this.targetquotelines) ? this.targetquotelines : [];
  }
  setTargetQuotelines(lines: ProcessorQuoteLine[]) {
    if (Array.isArray(lines)) {
      this.targetquotelines = lines;
    } else {
      this.targetquotelines = [];
    }
  }

  sourcequotelines: ProcessorQuoteLine[];
  getSourceQuotelines() {
    return Array.isArray(this.sourcequotelines) ? this.sourcequotelines : [];
  }
  //   setSourceQuoteLines(lines: ProcessorQuoteLine[]) {
  //     if (Array.isArray(lines)) {
  //       this.sourceQuoteLines = lines;
  //     } else {
  //       this.sourceQuoteLines = [];
  //     }
  //   }

  rollup: { [key: string]: number } = {}; // { [name]/[id] : [value] }
  setRollupResult(values: { [key: string]: number }) {
    for (let key of Object.keys(values)) {
      this.rollup[key] = values[key];
    }
  }
  getRollupFieldvalue(rollupfieldid: string): number {
    return this.rollup[rollupfieldid];
  }

  lookuprecord: { [key: string]: any } = {};
  setLookupObjectRecord(record: { [key: string]: any }) {
    this.lookuprecord = record;
  }

  product?: { [key: string]: any };
  private attributes?: ProductAttribute[];
  getAttributes(): ProductAttribute[] {
    return this.attributes;
  }
  setAttributes(attributes: ProductAttribute[]) {
    if (Array.isArray(attributes)) {
      this.attributes = attributes;
    }
  }
  sourceoptions?: { [key: string]: any }[];
  targetoptions?: { [key: string]: any }[];
  productAttributeValue: { [key: string]: any };

  constructor(
    context: 'quote' | 'product',
    quote: { [key: string]: any },
    data: {
      sourcequotelines?: ProcessorQuoteLine[];
      targetquotelines?: ProcessorQuoteLine[];
      product?: { [key: string]: any };
      attributes?: ProductAttribute[];
      sourceoptions?: { [key: string]: any }[];
      targetoptions?: { [key: string]: any }[];
      productAttributeValue?: { [key: string]: any };
    }
  ) {
    Object.assign(this, quote);
    this.quotekeys = Object.keys(quote);

    if (context === 'quote') {
      const { sourcequotelines, targetquotelines } = data;
      // source quote lines
      if (Array.isArray(sourcequotelines) && sourcequotelines.length) {
        this.sourcequotelines = sourcequotelines;
      } else {
        this.sourcequotelines = [];
      }
      // target quote lines
      if (Array.isArray(targetquotelines) && targetquotelines.length) {
        this.targetquotelines = targetquotelines;
      } else {
        this.targetquotelines = [];
      }
    }

    if (context === 'product') {
      const { product, attributes, sourceoptions, targetoptions } = data;
      this.product = product ?? {};
      this.sourceoptions = sourceoptions ?? [];
      this.targetoptions = targetoptions ?? [];
      this.attributes = attributes ?? [];
      this.productAttributeValue = this.productAttributeValue ?? {};
    }
  }

  getQuote(): { [key: string]: any } {
    const quote: { [key: string]: any } = {};
    for (let key of Object.keys(this)) {
      if (keysToSkip.has(key)) {
        continue;
      }
      quote[key] = this?.[key];
    }
    return quote;
  }

  addProduct(product: string, quantity: number = 1, maxquantity: number) {
    if (this.sourcequotelines?.length) {
      let productcount: number = 0;
      product = product?.toLowerCase();
      for (let quoteLine of this.sourcequotelines) {
        let name = quoteLine?.['productid__r']?.name?.toLowerCase();
        let code = quoteLine?.['productid__r']?.productcode?.toLowerCase();
        let id = quoteLine?.['productid__r']?.id?.toLowerCase();
        if (code == product || name == product || id === product) {
          productcount += 1;
        }
      }
      // const productAddCount = this.productsToAdd.filter(
      //   (rec) => rec.product === product
      // )?.length;
      // productCount += productAddCount;
      // const productRemoveCount = this.productsToRemove.filter(
      //   (rec) => rec === product
      // )?.length;
      // productCount -= productRemoveCount;
      if (productcount < maxquantity) {
        this.productstoadd.push({ product, quantity });
      }
    } else {
      this.productstoadd.push({ product, quantity });
    }
  }

  addOptions(
    bundleproduct: string,
    optionproduct: string,
    optionquantity: number = 1,
    optionmaxquantity: number = 1
  ) {
    if (!bundleproduct || !optionproduct) {
      return;
    }
    bundleproduct = bundleproduct?.toLowerCase();
    optionproduct = optionproduct?.toLowerCase();

    let isbundleproductexists: boolean = false;
    // let bundleProductLine: { [key: string]: any };
    let optionproductcount: number = 0;

    for (let line of this.sourcequotelines) {
      let productname = line?.[this.productlookupfield]?.name?.toLowerCase();
      let productcode =
        line?.[this.productlookupfield]?.productcode?.toLowerCase();
      let productid = line?.[this.productlookupfield]?.id?.toLowerCase();
      if (
        !isbundleproductexists &&
        [productname, productcode, productid].includes(bundleproduct)
      ) {
        isbundleproductexists = true;
        // bundleProductLine = { ...line };
      }
      if ([productname, productcode, productid].includes(optionproduct)) {
        optionproductcount += 1;
      }
    }

    // Bundle-product does not exists in Quote - Can't add the Option-product
    if (!isbundleproductexists) {
      return;
    }

    // const optionAddCount = this.optionsToAdd.filter(
    //   (rec) => rec.optionProduct === optionProduct
    // )?.length;
    // optionProductCount += optionAddCount;

    if (optionproductcount < optionmaxquantity) {
      this.optionstoadd.push({
        bundleproduct,
        // bundleProductId: bundleProductLine?.['ProductId__c'],
        bundleproductid: null,
        optionproduct,
        optionquantity,
      });
    }
  }

  removeProduct(product: string) {
    this.productstoremove.push(product);

    let lineidstoremove: string[] = [];
    for (let quoteline of this.sourcequotelines) {
      let name = quoteline?.['productId__r']?.name?.toLowerCase();
      let code = quoteline?.['productId__r']?.productcode?.toLowerCase();
      let id = quoteline?.['productId__r']?.id?.toLowerCase();
      if (code == product || name == product || id === product) {
        lineidstoremove.push(quoteline['id']);
      }
    }
  }

  // set quote field value
  setQuoteField(fieldname: string, fieldvalue: any) {
    this[fieldname] = fieldvalue;
  }

  // set quote line's field value
  setQuotelineField(fieldname: string, fieldvalue: any) {
    for (let idx = 0; idx < this.targetquotelines?.length; idx++) {
      this.targetquotelines[idx][fieldname] = fieldvalue;
    }
  }

  filterSourceQuotelines(
    field: string,
    value: string | number | boolean
  ): ProcessorQuoteLine[] {
    if (!this.sourcequotelines.length) {
      return [];
    }
    if (!field) {
      return [];
    }
    if (
      !Object.keys(this.sourcequotelines[0])
        .map((key) => key)
        .map((key) => key.toLowerCase())
        .includes(field.toLowerCase())
    ) {
      return [];
    }
    return this.sourcequotelines.filter((line) => line[field] == value);
  }

  filterTargetQuotelines(
    field: string,
    value: string | number | boolean
  ): ProcessorQuoteLine[] {
    if (!this.targetquotelines.length) {
      return [];
    }
    if (!field) {
      return [];
    }
    if (
      !Object.keys(this.targetquotelines[0])
        .map((key) => key)
        .map((key) => key.toLowerCase())
        .includes(field.toLowerCase())
    ) {
      return [];
    }
    return this.targetquotelines.filter((line) => line[field] == value);
  }

  getAttributeIdx(field: string): number {
    return this.attributes.findIndex(
      (attr) => attr.field.toLowerCase() === field.toLowerCase()
    );
  }

  setAttributeAllowedValue(field: string, values: string) {
    const jsonValues = JSON.parse(values);
    const attrIdx: number = this.getAttributeIdx(field);
    if (attrIdx === -1) {
      return;
    }
    this.attributes[attrIdx].allowedValues = jsonValues;
  }

  disableAttribute(field: string) {
    const attrIdx: number = this.getAttributeIdx(field);
    if (attrIdx === -1) {
      return;
    }
    this.attributes[attrIdx].isDisabled = true;
  }

  enableAttribute(field: string) {
    const attrIdx: number = this.getAttributeIdx(field);
    if (attrIdx === -1) {
      return;
    }
    this.attributes[attrIdx].isDisabled = false;
  }

  hideAttribute(field: string) {}
}
