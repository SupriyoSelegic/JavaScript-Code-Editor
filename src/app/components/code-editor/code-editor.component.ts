import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
  effect,
  input,
  Signal,
  signal,
} from '@angular/core';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { EditorState, StateEffect } from '@codemirror/state';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import {
  autocompletion,
  completeFromList,
  Completion,
  CompletionContext,
  completionKeymap,
  CompletionResult,
} from '@codemirror/autocomplete';
import { linter, lintKeymap } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';

import { darkTheme, lightTheme } from '../../themes/editor-theme';
import { HelpersService } from '../../services/helpers.service';
import { SuggestionsService } from '../../services/suggestions.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-code-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './code-editor.component.html',
  styleUrl: './code-editor.component.scss',
})
export class CodeEditorComponent implements OnInit, OnDestroy {
  @ViewChild('editor', { static: true }) editorElement!: ElementRef;
  // @Input() initialValue = '';
  initialValue = input<string>('');
  ruleType = input<'condition' | 'action'>();
  // @Input() ruleType: 'condition' | 'action';
  @Output() codeChange = new EventEmitter<string>();

  // selectedTheme: 'Dark' | 'Light' = 'Dark';
  selectedTheme: Signal<'Dark' | 'Light'> = signal('Dark');
  // codeEditorTheme: 'Dark' | 'Light' = 'Dark';
  errorMsg: string = '';

  private view: EditorView | null = null;

  constructor(
    private helpersService: HelpersService,
    private suggestionsService: SuggestionsService
  ) {
    // codeEditorTheme === 'Dark' ? darkTheme : lightTheme,
    effect(() => {
      const codeEditorTheme = this.helpersService.themeByCodeEditor();
      console.log(codeEditorTheme);
      if (codeEditorTheme) {
        this.view.dispatch({
          effects: StateEffect.reconfigure.of([
            this.helpersService.themeByCodeEditor().get(this.ruleType()) ===
            'Dark'
              ? darkTheme
              : lightTheme,
            javascript({ typescript: false, jsx: false }), // Ensure syntax highlighting remains
            keymap.of([...defaultKeymap, ...completionKeymap, ...lintKeymap]),
            autocompletion({
              override: [async (context) => this.fetchCompletions(context)],
            }),
            EditorView.updateListener.of((update: ViewUpdate) => {
              if (update.docChanged) {
                this.codeChange.emit(update.state.doc.toString());
                const code = update.state.doc.toString();
                const helpers = {
                  ...this.helpersService.customConditionHelpers,
                };
                console.log(code);

                try {
                  const fn = new Function(...Object.keys(helpers), code);
                  // const fn = new Function(code);
                  const result = fn(...Object.values(helpers));
                  this.errorMsg = '';
                  console.log('Result:', result);
                } catch (error) {
                  this.errorMsg = error;
                  // console.error('Error executing code:', error);
                }
              }
            }),
          ]),
        });
      }
    });
  }

  ngOnInit() {
    const state = EditorState.create({
      doc: this.initialValue(),
      extensions: [
        javascript({ typescript: false, jsx: false }),
        this.helpersService.themeByCodeEditor().get(this.ruleType()) === 'Dark'
          ? darkTheme
          : lightTheme,
        keymap.of([...defaultKeymap, ...completionKeymap, ...lintKeymap]),
        autocompletion({
          override: [async (context) => this.fetchCompletions(context)],
        }),
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged) {
            this.codeChange.emit(update.state.doc.toString());
            const code = update.state.doc.toString();
            const helpers = { ...this.helpersService.customConditionHelpers };
            console.log(helpers);

            try {
              const fn = new Function(...Object.keys(helpers), code);
              // const fn = new Function(code);
              const result = fn(...Object.values(helpers));
              this.errorMsg = '';
              console.log('Result:', result);
            } catch (error) {
              this.errorMsg = error;
              // console.error('Error executing code:', error);
            }
          }
        }),
      ],
    });

    this.view = new EditorView({
      state,
      parent: this.editorElement.nativeElement,
    });
  }

  // let globalCompletions = Object.getOwnPropertyNames(globalThis)
  //   .filter((name) => name.toLowerCase().includes(searchText))
  //   .map((name) => ({
  //     label: name,
  //     type:
  //       typeof globalThis[name] === 'function'
  //         ? 'function'
  //         : 'variable',
  //     apply: name, // Default behavior: insert as is
  //   }));

  private combineCompletionSources(
    context: CompletionContext
  ): CompletionResult | null {
    let customCompletions;
    if (this.ruleType() === 'condition') {
      customCompletions =
        this.suggestionsService.getConditionSuggestions(context);
    } else if (this.ruleType() === 'action') {
      customCompletions = this.suggestionsService.getActionSuggestions(context);
    }

    const localVariables = this.extractLocalVariables(context);

    // Only return a result if custom suggestions are present;
    // otherwise, return null so CodeMirror’s native completions are used.
    if (customCompletions || localVariables.length > 0) {
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

  ngOnDestroy() {
    this.view?.destroy();
  }

  runCode() {
    if (!this.view) return;

    const code = this.view.state.doc.toString();
    const helpers = { ...this.helpersService.customConditionHelpers };

    try {
      const fn = new Function(...Object.keys(helpers), code);
      const result = fn(...Object.values(helpers));
      console.log('Result:', result);
    } catch (error) {
      console.error('Error executing code:', error);
    }
  }

  getSelectedTheme() {
    // console.log('Switching theme to:', this.selectedTheme());

    this.helpersService.themeByCodeEditor.update((prev) => {
      const newMap = new Map(prev);
      newMap.set(this.ruleType(), this.selectedTheme());
      return newMap;
    });
  }

  // defaultJSCompletions(context) {
  //   let autocomplete = javascriptLanguage.data.of({ autocomplete })[0]
  //     ?.autocomplete;
  //   return autocomplete ? autocomplete(context) : null;
  // }

  async fetchCompletions(context) {
    const wordBefore = context.matchBefore(/\w*/);
    if (!wordBefore?.text) return null;
    const searchText = wordBefore.text.toLowerCase();

    const defaultCompletions = this.getDefaultCompletions(context);
    const customCompletions = await this.getCustomCompletions(context);
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
        ...customCompletions,
        ...userFunctionCompletions,
        ...globalFunctionCompletions,
        ...consoleCompletions,
        ...specialCompletions,
        ...customVariableCompletions,
      ].filter((s) => s.label.toLowerCase().includes(searchText)),
    };
  }

  // Fetch default JavaScript completions
  getDefaultCompletions(context) {
    const sources = context.state.languageDataAt('autocomplete', context.pos);
    return sources.length && typeof sources[0] === 'function'
      ? sources[0](context)?.options || []
      : [];
  }

  // Fetch custom completions
  async getCustomCompletions(context) {
    return typeof this.combineCompletionSources === 'function'
      ? (await this.combineCompletionSources(context))?.options || []
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
      { label: 'console', type: 'variable' },
      { label: 'log', type: 'function', apply: 'console.log();' },
      { label: 'warn', type: 'function', apply: 'console.warn();' },
      { label: 'error', type: 'function', apply: 'console.error();' },
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
}
