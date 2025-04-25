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
  output,
} from '@angular/core';
import { EditorView, keymap, ViewUpdate } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { history, historyKeymap } from '@codemirror/commands';
import { EditorState, StateEffect } from '@codemirror/state';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
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

// import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets';

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
  type = input<'condition' | 'action'>();
  // @Input() ruleType: 'condition' | 'action';
  @Output() codeChange = new EventEmitter<string>();
  selectedTheme: Signal<'Dark' | 'Light'> = signal('Dark');
  errorMsg: string = '';

  private view: EditorView | null = null;

  constructor(
    private helpersService: HelpersService,
    private suggestionsService: SuggestionsService
  ) {
    effect(() => {
      const codeEditorTheme = this.helpersService.themeByCodeEditor();
      console.log(codeEditorTheme);
      if (codeEditorTheme) {
        this.view.dispatch({
          effects: StateEffect.reconfigure.of([
            this.helpersService.themeByCodeEditor().get(this.type()) === 'Dark'
              ? darkTheme
              : lightTheme,
            history(),
            javascript({ typescript: false, jsx: false }), // Ensure syntax highlighting remains
            keymap.of([
              ...defaultKeymap,
              ...completionKeymap,
              ...historyKeymap,
              ...lintKeymap,
              ...closeBracketsKeymap,
            ]),
            closeBrackets(),
            autocompletion({
              override: [
                async (context) =>
                  this.suggestionsService.fetchCompletions(
                    context,
                    this.type()
                  ),
              ],
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
        this.helpersService.themeByCodeEditor().get(this.type()) === 'Dark'
          ? darkTheme
          : lightTheme,

        history(),
        keymap.of([
          ...defaultKeymap,
          ...completionKeymap,
          ...historyKeymap,
          ...lintKeymap,
          ...closeBracketsKeymap,
        ]),
        autocompletion({
          override: [
            async (context) =>
              this.suggestionsService.fetchCompletions(context, this.type()),
          ],
        }),
        closeBrackets(),
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
      newMap.set(this.type(), this.selectedTheme());
      return newMap;
    });
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
