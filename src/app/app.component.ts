import { Component } from '@angular/core';

import { CodeEditorComponent } from './components/code-editor/code-editor.component';
import * as acorn from 'acorn';
import { HelpersService } from './services/helpers.service';

@Component({
  selector: 'app-root',
  imports: [CodeEditorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(private helpersService: HelpersService) {}

  errorMsg: string = '';

  title = 'JavaScript Code Editor';

  defaultCode = `// Try using our helper functions!

// Example 1: Using conditions with quotes
const conditions = "price > 100 and quantity >= 5";
const result = applyquoteconditions(conditions);
console.log("Conditions satisfied:", result);

// Example 2: Filter quote lines
const expensiveItems = filterquotelines("price", 1000);
console.log("Expensive items:", expensiveItems);

// Example 3: Check attributes
const hasColor = checkAttributeValue("color", "red");
console.log("Has red color:", hasColor);

// Example 4: Structure conditions
const structuredCondition = structureconditions("price > 100", "item");
console.log("Structured condition:", structuredCondition);
  `;

  onCodeChange(code: any) {
    console.log('Code updated:', code);
  }
}
