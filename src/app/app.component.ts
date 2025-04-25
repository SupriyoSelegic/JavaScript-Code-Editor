import { Component, OnInit } from '@angular/core';

import { CodeEditorComponent } from './components/code-editor/code-editor.component';
import * as acorn from 'acorn';
import { HelpersService } from './services/helpers.service';
import { SuggestionsService } from './services/suggestions.service';
import { CompletionContext } from '@codemirror/autocomplete';

@Component({
  selector: 'app-root',
  imports: [CodeEditorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  errorMsg: string = '';

  title = 'JavaScript Code Editor';

  defaultCode = `// Add your code here`;

  onCodeChange(code: any) {
    console.log('Code updated:', code);
  }
}
