/*
Parser for the CloudGram syntax.

It leverages the chevrotain library for doing the main lifting and define a single
entrypoint, the `parse` method, to abstract away the underlying library.

chevrotain requires three main components to create a parser:
- a Lexer, defined in lexer.js, together with the tokens for the language
- a parser, defined in parser.js
- an interpreter, defined in interpreter.js, that converts the parsed output into a
  format suitable for the rest of the application
*/

import {IRecognitionException} from 'chevrotain';
import {lexer} from './lexer';
import {parser} from './parser';
import {interpreter} from './interpreter';
import {Diagram, Error} from '../types';

const convertError = ({message, token, resyncedTokens}: IRecognitionException, text: string): Error => {
  let {startLine, endLine, startColumn, endColumn} = token;
  let previousStartLine = undefined;
  let previousEndLine = undefined;
  let previousStartColumn = undefined;
  let previousEndColumn = undefined;
  if (resyncedTokens.length > 0) {
    const previousToken = resyncedTokens[0];
    ({
      startLine: previousStartLine,
      endLine: previousEndLine,
      startColumn: previousStartColumn,
      endColumn: previousEndColumn,
    } = previousToken);
  } else if (token.tokenType.name === 'EOF') {
    const lines = text.trimEnd().split(/\r\n|\r|\n/);
    startLine = lines.length;
    endLine = lines.length;
    startColumn = lines ? lines[lines.length - 1].length : undefined;
    endColumn = lines ? lines[lines.length - 1].length : undefined;
  }

  return {
    message,
    // some errors, like the EOF token errors, don't have line and column info so fallback
    // to using the line and column from last recognised token
    line: {
      start: startLine ?? previousStartLine,
      end: endLine ?? previousEndLine,
    },
    column: {
      start: startColumn ?? previousStartColumn,
      end: endColumn ?? previousEndColumn,
    },
  };
};

export interface ParseResult {
  errors: Error[];
  parsed?: Diagram;
}

export const parse = (text: string): ParseResult => {
  const lexResult = lexer.tokenize(text);
  parser.input = lexResult.tokens;
  const cst = parser.diagram();
  const parsed = parser.errors.length === 0 ? interpreter.visit(cst) : undefined;

  return {
    parsed,
    errors: parser.errors.map(e => convertError(e, text)),
  };
};
