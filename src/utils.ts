import { AstPath, doc } from 'prettier';
// @ts-ignore
import Comment from 'stylus/lib/nodes/comment.js';
import { Stylus } from './types';

export type ArrayKeys<T, P extends keyof T = keyof T> = P extends string
  ? T[P] extends unknown[]
    ? P
    : never
  : never;

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

export function getCommentSequence(seq: Stylus.Node[], start = 0) {
  let end = start;
  while (isInlineComment(seq[end])) {
    end++;
  }
  const comments = seq
    .slice(start, end)
    .map((c) => [(c as Stylus.Comment).str, doc.builders.hardline]);
  if (comments.length > 0) {
    return comments;
  }
}
