// TODO: typing
// @ts-ignore
import StylusParser from 'stylus/lib/parser.js';
// @ts-ignore
import Token from 'stylus/lib/token.js';
// @ts-ignore
import Comment from 'stylus/lib/nodes/comment.js';
import { isBlankLine, splitLinesWithEols } from './utils';

export const BLANK_LINE_PLACEHOLDER = 'APLACEHOLDERWHICHNEVERCOLLIDES';
/**
 * Stylus parser just ignores blank lines
 * We replace blank lines with single-line comments to preserve them
 * Note that comments should have the correct indent level to be successfully parsed
 */
function preserveBlankLines(text: string) {
  const lines = splitLinesWithEols(text);
  for (let i = 0; i < lines.length; i++) {
    if (isBlankLine(lines[i])) {
      let indent = '';
      if (i > 0) {
        indent = lines[i - 1].match(/\s*/)?.[0] ?? '';
      }
      lines[i] = indent + '//' + BLANK_LINE_PLACEHOLDER + lines[i];
    }
  }
  text = lines.join('');
  return text;
}

export function parse(text: string) {
  text = preserveBlankLines(text);
  const parser = new StylusParser(text, { cache: false });
  const originalComment = parser.lexer.comment.bind(parser.lexer);
  // Hack stylus lexer to preserve single line comment
  parser.lexer.comment = function () {
    if ('/' == this.str[0] && '/' == this.str[1]) {
      let end = this.str.indexOf('\n');
      if (-1 == end) end = this.str.length;
      const str = this.str.substr(0, end);
      this.skip(end);
      return new Token('comment', new Comment(str, false, true));
    }
    return originalComment();
  };
  const result = parser.parse();
  result.text = text;
  return result;
}
