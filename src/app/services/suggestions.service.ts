import { Injectable } from '@angular/core';

import { CompletionContext } from '@codemirror/autocomplete';
import { HelpersService } from './helpers.service';

@Injectable({
  providedIn: 'root',
})
export class SuggestionsService {
  constructor(private helpersService: HelpersService) {}

  getConditionSuggestions(context: CompletionContext) {
    const word = context.matchBefore(/\w*/);
    if (!word || word.from === word.to) return null;

    const options = Object.keys(this.helpersService.customConditionHelpers).map(
      (helper) => ({
        label: helper,
        type: 'function',
        info: this.helpersService.getConditionHelperDocs(
          helper as keyof typeof this.helpersService.customConditionHelpers
        ),
      })
    );

    return {
      from: word.from,
      options,
      validFor: /^\w*$/,
    };
  }

  getActionSuggestions(context: CompletionContext) {
    const word = context.matchBefore(/\w*/);
    if (!word || word.from === word.to) return null;

    const options = Object.keys(this.helpersService.customActionHelpers).map(
      (helper) => ({
        label: helper,
        type: 'function',
        info: this.helpersService.getActionHelperDocs(
          helper as keyof typeof this.helpersService.customActionHelpers
        ),
      })
    );
    console.log(options);

    return {
      from: word.from,
      options,
      validFor: /^\w*$/,
    };
  }
}
