import { Injectable, signal } from '@angular/core';

import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { HelpersService } from './helpers.service';
import { syntaxTree } from '@codemirror/language';

@Injectable({
  providedIn: 'root',
})
export class SuggestionsService {
  constructor(private helpersService: HelpersService) {}

  async fetchCompletions(context, type) {
    const code = context.state.doc.toString();

    const rootWord = context.matchBefore(/\w*/);
    console.log(rootWord.text);

    if (
      rootWord &&
      'quote'.startsWith(rootWord.text) &&
      rootWord.text == 'quote'
    ) {
      console.log(rootWord.text);
      return {
        from: rootWord.from,
        options: [
          {
            label: 'quote',
            type: 'variable',
            info: 'Helper functions related to quotes',
            apply: 'quote',
          },
        ],
        validFor: /^\w*$/,
      };
    }

    const word = context.matchBefore(/(?:quote\.)\w*/);

    if (word) {
      const customCompletions = await this.getCustomCompletions(context, type);
      console.log('customCompletions - ', customCompletions);

      const searchText = word?.text.split('.')[1]?.toLowerCase() || '';
      const dotIndex = word.text.lastIndexOf('.') + 1;
      const from = word.from + dotIndex;

      if (customCompletions && customCompletions.length > 0) {
        const options = customCompletions.filter((s) =>
          s.label.toLowerCase().includes(searchText)
        );

        return {
          from,
          options,
          validFor: /^\w*$/,
        };
      }
    }

    // Match "objectName." pattern first
    const objectMatch = context.matchBefore(/\w+\./); // e.g., "test."
    console.log(objectMatch);

    if (objectMatch) {
      const objectName = objectMatch.text.slice(0, -1); // remove trailing dot
      const objectProps = this.extractObjectProperties(code);
      const properties = objectProps[objectName];

      if (properties && properties.length > 0) {
        return {
          from: objectMatch.to,
          options: properties.map((key) => ({
            label: key,
            type: 'property',
          })),
        };
      }
    }

    // console.log(customCompletions);
    // return {
    //   from: wordBefore.from,
    //   options: [...customCompletions].filter((s) =>
    //     s.label.toLowerCase().includes(searchText)
    //   ),
    // };

    const wordBefore = context.matchBefore(/\w*/);
    console.log(wordBefore);

    if (!wordBefore?.text) return null;
    const searchText = wordBefore.text.toLowerCase();
    console.log(searchText);

    const defaultCompletions = this.getDefaultCompletions(context);
    const userFunctionCompletions = this.getUserFunctionCompletions();
    const globalFunctionCompletions = this.getGlobalFunctionCompletions();
    const consoleCompletions = this.getConsoleCompletions();
    const specialCompletions = this.getSpecialCompletions();
    const customVariableCompletions =
      this.getCustomVariableCompletions(context);

    return {
      from: wordBefore.from,
      options: [
        ...defaultCompletions,
        // ...customCompletions,
        ...userFunctionCompletions,
        ...globalFunctionCompletions,
        ...consoleCompletions,
        ...specialCompletions,
        ...customVariableCompletions,
      ].filter((s) => s.label.toLowerCase().includes(searchText)),
    };
  }

  // Fetch custom completions
  async getCustomCompletions(context, type) {
    return typeof this.combineCompletionSources === 'function'
      ? (await this.combineCompletionSources(context, type))?.options || []
      : [];
  }

  extractObjectProperties(code: string): Record<string, string[]> {
    const objectMap: Record<string, string[]> = {};

    // Match patterns like: const test = { name: '...', age: ... };
    const objectRegex = /const\s+(\w+)\s*=\s*{([^}]*)}/g;
    let match;

    while ((match = objectRegex.exec(code)) !== null) {
      const varName = match[1];
      const body = match[2];

      const propRegex = /(\w+)\s*:/g;
      const props: string[] = [];

      let propMatch;
      while ((propMatch = propRegex.exec(body)) !== null) {
        props.push(propMatch[1]);
      }

      objectMap[varName] = props;
    }

    return objectMap;
  }

  // Fetch default JavaScript completions
  getDefaultCompletions(context) {
    const sources = context.state.languageDataAt('autocomplete', context.pos);
    return sources.length && typeof sources[0] === 'function'
      ? sources[0](context)?.options || []
      : [];
  }

  // Fetch user-defined function completions
  getUserFunctionCompletions() {
    return Object.keys(window)
      .filter((key) => typeof window[key] === 'function')
      .map((fnName) =>
        this.createFunctionCompletion(fnName, window[fnName].length)
      );
  }

  // Fetch global function completions
  getGlobalFunctionCompletions() {
    return Object.getOwnPropertyNames(globalThis)
      .filter((name) => typeof globalThis[name] === 'function')
      .map((fnName) =>
        this.createFunctionCompletion(fnName, globalThis[fnName].length)
      );
  }

  // Fetch console method completions
  getConsoleCompletions() {
    return Object.getOwnPropertyNames(console || {})
      .filter((method) => typeof console[method] === 'function')
      .map((method) => ({
        label: method,
        type: 'function',
        apply: `console.${method}();`,
      }));
  }

  // Get predefined shortcut completions
  getSpecialCompletions() {
    return [
      {
        label: 'console',
        type: 'variable',
        apply: 'console.log();',
      },
    ];
  }

  getCustomVariableCompletions(context) {
    const code = context.state.doc.toString(); // Get the entire editor content
    const variableRegex = /\b(let|const|var)\s+([a-zA-Z_$][\w$]*)/g;

    let match;
    const variables = [];

    while ((match = variableRegex.exec(code)) !== null) {
      variables.push({ label: match[2], type: 'variable' });
    }

    return variables;
  }

  // Helper function to create function completions
  createFunctionCompletion(fnName, paramCount) {
    const placeholders = Array.from(
      { length: paramCount },
      (_, i) => `param${i + 1}`
    ).join(', ');
    return {
      label: fnName,
      type: 'function',
      apply: `${fnName}(${placeholders});`,
    };
  }

  // Handle code change updates
  handleCodeChange(update, codeChangeEmitter, helpersService) {
    if (update.docChanged) {
      const code = update.state.doc.toString();
      codeChangeEmitter.emit(code);

      try {
        const fn = new Function(code);
        console.log(
          'Result:',
          fn(...Object.values(helpersService.customConditionHelpers))
        );
      } catch (error) {
        console.error('Error executing code:', error);
      }
    }
  }

  private combineCompletionSources(
    context: CompletionContext,
    type: string
  ): CompletionResult | null {
    let customCompletions;
    console.log('type -', type);

    if (type === 'condition') {
      customCompletions = this.getConditionSuggestions(context);
      console.log(customCompletions);
    } else if (type === 'action') {
      customCompletions = this.getActionSuggestions(context);
    }

    const localVariables = this.extractLocalVariables(context);
    // console.log(localVariables);
    // console.log(this.customCompletions()?.options);

    // Only return a result if custom suggestions are present;
    // otherwise, return null so CodeMirror’s native completions are used.
    if (customCompletions?.options || localVariables.length > 0) {
      return {
        from: context.pos,
        options: [...(customCompletions?.options || []), ...localVariables],
        // Allow CodeMirror to also filter and merge with its own completions:
        filter: true,
      };
    }
    return null;
  }

  // Extract local variables from the current document
  private extractLocalVariables(context: CompletionContext) {
    const result = [];
    const text = context.state.doc.toString();
    const currentPos = context.pos;
    const tree = syntaxTree(context.state);

    // Track scope to find variables declared in the current scope
    let scope = tree.resolveInner(currentPos, -1);
    while (scope) {
      // Find all VariableName nodes in this scope
      let cursor = scope.cursor();
      do {
        if (cursor.name === 'VariableDefinition' && cursor.from < currentPos) {
          // Get the name node
          const nameNode = cursor.node.getChild('VariableName');
          if (nameNode) {
            const varName = context.state.doc.sliceString(
              nameNode.from,
              nameNode.to
            );
            result.push({
              label: varName,
              type: 'variable',
              boost: 100, // Higher priority for local variables
            });
          }
        }

        // Function definitions
        if (cursor.name === 'FunctionDeclaration' && cursor.from < currentPos) {
          const nameNode = cursor.node.getChild('VariableName');
          if (nameNode) {
            const funcName = context.state.doc.sliceString(
              nameNode.from,
              nameNode.to
            );
            result.push({
              label: funcName,
              type: 'function',
              boost: 100,
            });
          }
        }
      } while (cursor.next());

      // Move up to parent scope
      scope = scope.parent;
    }

    return result;
  }

  getConditionSuggestions(context: CompletionContext) {
    const match = context.matchBefore(/quote\.(\w*)?/);
    if (!context.explicit && (!match || match.from === match.to)) return null;

    // Extract what's typed after the dot
    const afterDot = match?.text.split('.')[1] || '';

    const quoteHelpers = this.helpersService.customConditionHelpers.quote;

    const options = Object.entries(quoteHelpers).map(([key, fn]) => {
      const fnStr = fn.toString();
      const paramMatch = fnStr.match(/\(([^)]*)\)/);
      const params = paramMatch ? paramMatch[1].trim() : '';
      const insertText = `${key}(${params});`;

      return {
        label: insertText,
        type: 'function',
        info: this.helpersService.getConditionHelperDocs(
          key as keyof typeof quoteHelpers
        ),
        apply: insertText,
      };
    });

    return {
      from: match ? match.to - afterDot.length : context.pos,
      options: options.filter((opt) =>
        opt.label.toLowerCase().startsWith(afterDot.toLowerCase())
      ),
      validFor: /^\w*$/,
    };
  }

  getActionSuggestions(context: CompletionContext) {
    const match = context.matchBefore(/quote\.(\w*)?/);
    if (!context.explicit && (!match || match.from === match.to)) return null;

    // Extract what's typed after the dot
    const afterDot = match?.text.split('.')[1] || '';

    const quoteHelpers = this.helpersService.customActionHelpers.quote;

    const options = Object.entries(quoteHelpers).map(([key, fn]) => {
      const fnStr = fn.toString();
      const paramMatch = fnStr.match(/\(([^)]*)\)/);
      const params = paramMatch ? paramMatch[1].trim() : '';
      const insertText = `${key}(${params});`;

      return {
        label: insertText,
        type: 'function',
        info: this.helpersService.getActionHelperDocs(
          key as keyof typeof quoteHelpers
        ),
        apply: insertText,
      };
    });

    return {
      from: match ? match.to - afterDot.length : context.pos,
      options: options.filter((opt) =>
        opt.label.toLowerCase().startsWith(afterDot.toLowerCase())
      ),
      validFor: /^\w*$/,
    };
  }
}
