import { EditorView, lineNumbers } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

const chalky = '#e5c07b',
  coral = '#e06c75',
  cyan = '#56b6c2',
  invalid = '#ffffff',
  ivory = '#abb2bf',
  stone = '#7d8799',
  malibu = '#61afef',
  sage = '#98c379',
  whiskey = '#d19a66',
  violet = '#c678dd';

export const darkColors = {
  background: '#282c34',
  foreground: ivory,
  selection: '#3E4451',
  selectionMatch: '#3E4451',
  lineHighlight: '#2c313c',
  gutterBackground: '#282c34',
  gutterForeground: stone,
};

export const darkEditorTheme = EditorView.theme({
  '&': {
    color: darkColors.foreground,
    backgroundColor: darkColors.background,
    borderRadius: '0.5rem',
    height: '100%',
    fontSize: '14px',
    fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
  },
  '.cm-content': {
    caretColor: darkColors.foreground,
    padding: '0.5rem 0',
    minHeight: '100%',
  },
  '.cm-scroller': {
    overflow: 'auto',
    minHeight: '100%',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-line': {
    color: darkColors.foreground,
    padding: '0 10px',
    lineHeight: '1.6',
    fontFamily: 'inherit',
  },
  '.cm-selectionBackground': {
    backgroundColor: darkColors.selection,
  },
  '.cm-cursor': {
    borderLeftColor: darkColors.foreground,
  },
  '.cm-gutters': {
    backgroundColor: darkColors.gutterBackground,
    color: darkColors.gutterForeground,
    border: 'none',
    borderRight: `1px solid ${darkColors.lineHighlight}`,
    minHeight: '100%',
    padding: '0 0.5rem',
  },
  '.cm-activeLineGutter': {
    backgroundColor: darkColors.lineHighlight,
  },
  // Autocomplete styles
  '.cm-tooltip': {
    backgroundColor: darkColors.background,
    border: `1px solid ${darkColors.lineHighlight}`,
    borderRadius: '4px',
  },
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '& > ul > li': {
      fontFamily: 'inherit',
      padding: '4px 8px',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: darkColors.selection,
      color: darkColors.foreground,
    },
  },
});

export const darkSyntaxHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: violet },
  { tag: t.operator, color: violet },
  { tag: t.special(t.variableName), color: malibu },
  { tag: t.typeName, color: chalky },
  { tag: t.atom, color: cyan },
  { tag: t.number, color: whiskey },
  { tag: t.string, color: sage },
  { tag: t.special(t.string), color: sage },
  { tag: t.comment, color: stone },
  { tag: t.variableName, color: coral },
  { tag: t.tagName, color: coral },
  { tag: t.bracket, color: ivory },
  { tag: t.invalid, color: invalid },
  // Additional syntax highlighting
  { tag: t.propertyName, color: malibu },
  { tag: t.function(t.variableName), color: malibu },
  { tag: t.definition(t.variableName), color: coral },
]);

const blue = '#007acc',
  green = '#008000',
  red = '#d73a49',
  orange = '#d19a66',
  purple = '#6f42c1',
  black = '#000000',
  gray = '#586069',
  white = '#ffffff';

export const lightColors = {
  background: '#ffffff',
  foreground: black,
  selection: '#d7eaff',
  selectionMatch: '#b3d7ff',
  lineHighlight: '#f3f3f3',
  gutterBackground: '#f5f5f5',
  gutterForeground: gray,
};

export const lightEditorTheme = EditorView.theme({
  '&': {
    color: lightColors.foreground,
    backgroundColor: lightColors.background,
    borderRadius: '0.5rem',
    height: '100%',
    fontSize: '14px',
    fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
  },
  '.cm-content': {
    caretColor: lightColors.foreground,
    padding: '0.5rem 0',
    minHeight: '100%',
  },
  '.cm-scroller': {
    overflow: 'auto',
    minHeight: '100%',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-line': {
    color: lightColors.foreground,
    padding: '0 10px',
    lineHeight: '1.6',
    fontFamily: 'inherit',
  },
  '.cm-selectionBackground': {
    backgroundColor: lightColors.selection,
  },
  '.cm-cursor': {
    borderLeftColor: lightColors.foreground,
  },
  '.cm-gutters': {
    backgroundColor: lightColors.gutterBackground,
    color: lightColors.gutterForeground,
    border: 'none',
    borderRight: `1px solid ${lightColors.lineHighlight}`,
    minHeight: '100%',
    padding: '0 0.5rem',
  },
  '.cm-activeLineGutter': {
    backgroundColor: lightColors.lineHighlight,
  },
  // Autocomplete styles
  '.cm-tooltip': {
    backgroundColor: lightColors.background,
    border: `1px solid ${lightColors.lineHighlight}`,
    borderRadius: '4px',
  },
  '.cm-tooltip.cm-tooltip-autocomplete': {
    '& > ul > li': {
      fontFamily: 'inherit',
      padding: '4px 8px',
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: lightColors.selectionMatch,
      color: lightColors.foreground,
    },
  },
});

export const lightSyntaxHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: purple },
  { tag: t.operator, color: black },
  { tag: t.special(t.variableName), color: blue },
  { tag: t.typeName, color: orange },
  { tag: t.atom, color: red },
  { tag: t.number, color: orange },
  { tag: t.string, color: green },
  { tag: t.special(t.string), color: green },
  { tag: t.comment, color: gray, fontStyle: 'italic' },
  { tag: t.variableName, color: black },
  { tag: t.tagName, color: red },
  { tag: t.bracket, color: black },
  { tag: t.invalid, color: red },
  { tag: t.propertyName, color: blue },
  { tag: t.function(t.variableName), color: blue },
  { tag: t.definition(t.variableName), color: black },
]);

export const lightTheme = [
  lightEditorTheme,
  syntaxHighlighting(lightSyntaxHighlightStyle),
  lineNumbers(),
];

export const darkTheme = [
  darkEditorTheme,
  syntaxHighlighting(darkSyntaxHighlightStyle),
  lineNumbers(),
];
