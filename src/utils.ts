import { AstPath } from 'prettier';
// @ts-ignore
import Comment from 'stylus/lib/nodes/comment.js';
import { Stylus } from './types';

export type ArrayKeys<T, P extends keyof T = keyof T> = P extends string
  ? T[P] extends unknown[]
    ? P
    : never
  : never;

/**
 * https://gist.github.com/rauschma/d4b700385970ce6e1a70e49ffa0dff6a
 * NOTE: it uses lookbehind syntax so it may not work in bun for now
 */
export function splitLinesWithEols(str: string) {
  return str.split(/(?<=\r?\n)/);
}

export function isBlankLine(line: string) {
  return /^\s+$/.test(line);
}

export function isInlineComment(node: unknown) {
  return node instanceof Comment && (node as Stylus.Comment).inline;
}
export function isNull(node: unknown) {
  return node && typeof node === 'object' && (node as any).isNull;
}

/**
 * Identifier with no value(i.e. not identifier declaration)
 */
export function isSingleIdent(node: Stylus.Ident) {
  return isNull(node.val);
}

export function isAstRoot(path: AstPath) {
  return path.stack.length === 1;
}
