// @ts-ignore
import Parser from 'stylus/lib/parser.js';
// @ts-ignore
import Lexer from 'stylus/lib/lexer.js';
// @ts-ignore
import Comment from 'stylus/lib/nodes/comment.js';
import * as assert from 'assert/strict';
import * as prettier from 'prettier';
import {
  ArrayKeys,
  isInlineComment,
  isAstRoot,
  isSingleIdent,
  getCommentSequence
} from './utils';
import { Stylus } from './types';
const b = prettier.doc.builders;

const languages: prettier.SupportLanguage[] = [
  {
    extensions: ['.styl'],
    name: 'Stylus',
    parsers: ['stylus']
  }
];

const AST_FORMAT = 'postcss-stylus-ast';

const parsers: Record<string, prettier.Parser> = {
  stylus: {
    parse: (text) => {
      const result = new Parser(text, { cache: false }).parse();
      result.text = text;
      return result;
    },
    astFormat: AST_FORMAT,
    locStart: () => {
      throw new Error();
    },
    locEnd: () => {
      throw new Error();
    }
  }
};

function block(doc: prettier.Doc) {
  return b.indent([
    b.hardline,
    b.join(b.hardline, Array.isArray(doc) ? doc : [doc])
  ]);
}

type Printer = prettier.Printer<Stylus.Node>['print'];

const printStylus: Printer = (path, options, print) => {
  const node = path.getValue();
  const children = <T, P extends ArrayKeys<T> = ArrayKeys<T>>(_: T, prop: P) =>
    path.map(print, prop);
  const child = <T>(_: T, prop: keyof T) => path.call(print, prop);

  switch (node.nodeName) {
    case 'root':
      return [
        b.join([b.hardline, b.hardline], children(node, 'nodes')),
        b.hardline
      ];
    case 'group': {
      return [
        b.join(b.hardline, children(node, 'nodes')),
        child(node, 'block')
      ];
    }
    case 'selector': {
      return children(node, 'segments');
    }
    case 'block': {
      return block(children(node, 'nodes'));
    }
    case 'property': {
      const value = node.expr.nodes[0] as Stylus.Node;
      const sep =
        value.nodeName === 'ident' && !isSingleIdent(value) ? ': ' : ' ';
      // colon cannot be omitted in `width: w = 150px`
      return [children(node, 'segments'), sep, child(node, 'expr')];
    }
    case 'expression': {
      const content = b.join(' ', children(node, 'nodes'));
      const parent = path.getParentNode();
      if (parent?.nodeName === 'selector' || parent?.nodeName === 'keyframes') {
        return ['{', content, '}'];
      }
      return content;
    }
    case 'binop': {
      return [child(node, 'left'), ' ', node.op, ' ', child(node, 'right')];
    }
    case 'unaryop': {
      return [node.op, '(', child(node, 'expr'), ')'];
    }
    case 'each': {
      return [
        'for ',
        node.val,
        ...(node.key ? [', ', node.key] : []),
        ' in ',
        child(node, 'expr'),
        child(node, 'block')
      ];
    }
    case 'call': {
      return [node.name, child(node, 'args')];
    }
    case 'params':
    case 'arguments': {
      return ['(', b.join(', ', children(node, 'nodes')), ')'];
    }
    case 'function': {
      return [node.name, child(node, 'params'), child(node, 'block')];
    }
    case 'unit':
      return `${node.val}${node.type ?? ''}`;
    case 'ident':
      if (isSingleIdent(node)) {
        return node.string;
      } else {
        if (node.val.nodeName === 'function') {
          return child(node, 'val');
        }
        return [node.name, ' = ', child(node, 'val')];
      }
    case 'literal':
      return node.string;
    case 'string': // e.g. content
      return [`'`, node.string, `'`];
    case 'comment':
      return node.str;
    case 'rgba':
      return (node as any).raw;
    case 'keyframes':
      return [
        '@keyframes ',
        children(node, 'segments'),
        child(node as any, 'block')
      ];
    default:
      console.error(node);
      // @ts-expect-error
      throw new Error(node.nodeName + ' is not supported yet');
  }
};

// flatten AST into sequence, with comment nodes
const toSequence = (path: prettier.AstPath<Stylus.Node>): Stylus.Node[] => {
  assert.equal(path.stack.length, 1);

  let seq: Stylus.Node[] = [];
  const toRemove: Record<number, true> = {};

  const recurse = (path: prettier.AstPath<Stylus.Node>) => {
    const node = path.getValue();
    const i = seq.length;
    seq.push(node);
    printStylus(path, null!, recurse as any);
    // by keeping "atomic" nodes only, we can get something like token sequence
    if (seq[seq.length - 1] !== node) {
      toRemove[i] = true;
    }
  };
  recurse(path);
  seq = seq.filter((_, i) => !toRemove[i]);

  const comments: Stylus.Node[] = [];
  const lexer = new Lexer((path.stack[0] as any).text);
  // Stylus Lexer skips inline comment, hack it
  const originalSkip = lexer.skip.bind(lexer);
  lexer.skip = (len: number) => {
    if (lexer.str.slice(0, 2) === '//') {
      const comment = new Comment(lexer.str.slice(0, len), false, true);
      comment.lineno = lexer.lineno;
      comment.column = lexer.column;
      comments.push(comment);
    }
    originalSkip(len);
  };

  let token: Stylus.Token;
  while ((token = lexer.advance()) && token.type !== 'eos');

  for (const comment of comments) {
    // find the first node after the comment
    let insertIndex = seq.findIndex(
      (node) =>
        node.lineno > comment.lineno ||
        (node.lineno == comment.lineno && node.column >= comment.column)
    );
    if (insertIndex === -1) {
      insertIndex = seq.length;
    }
    seq.splice(insertIndex, 0, comment);
  }

  return seq;
};

const seq: Stylus.Node[] = [];

const print: prettier.Printer<Stylus.Node>['print'] = (
  path,
  options,
  prettierPrint
) => {
  if (path.stack.length === 1) {
    seq.length = 0;
    seq.push(...toSequence(path));
  }
  const node = path.getValue();
  const index = seq.indexOf(node);
  if (
    seq[index + 1] instanceof Comment &&
    (seq[index + 1] as Stylus.Comment).inline
  ) {
    return [
      printStylus(path, options, prettierPrint),
      ' ',
      (seq[index + 1] as Stylus.Comment).str
    ];
  }
  return printStylus(path, options, prettierPrint);
};

const printers = {
  [AST_FORMAT]: {
    print
  }
};

module.exports = {
  languages,
  parsers,
  printers
};
