import * as prettier from 'prettier';
import { BLANK_LINE_PLACEHOLDER, parse } from './parser';
import { ArrayKeys, isSingleIdent } from './utils';
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
    parse,
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
    (path as any).map(print, prop);
  const child = <T>(_: T, prop: keyof T) => (path as any).call(print, prop);

  switch (node.nodeName) {
    case 'root':
      return [b.join(b.hardline, children(node, 'nodes')), b.hardline];
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
      const parent = path.getParentNode();
      const grandparent = path.getParentNode(1);
      // HACK: stylus parses url(a/b.png) as a function call with five arguments(a, /, b, ., png)
      // where we shouldn't add spaces
      const isUrl =
        grandparent?.nodeName === 'call' && grandparent.name === 'url';
      const content = b.join(isUrl ? '' : ' ', children(node, 'nodes'));
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
        // TODO: improve @types/stylus?
        return `${node.string}${(node as any).rest ? '...' : ''}`;
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
      if (node.str.includes(BLANK_LINE_PLACEHOLDER)) {
        return '';
      }
      return node.str;
    case 'rgba':
      return ((node as any).raw as string).trim();
    case 'keyframes':
      return [
        '@keyframes ',
        children(node, 'segments'),
        child(node as any, 'block')
      ];
    case 'media':
      return ['@media ', child(node, 'val'), child(node as any, 'block')];
    case 'querylist':
      return b.join(', ', children(node, 'nodes'));
    case 'query':
      return [
        node.resolvedPredicate ? node.resolvedPredicate + ' ' : '',
        node.resolvedType ? node.resolvedType + ' and ' : '',
        b.join(' and ', children(node, 'nodes'))
      ];
    case 'feature':
      return ['(', children(node, 'segments'), ': ', child(node, 'expr'), ')'];
    case 'import':
      return [
        `@${node.once ? 'require' : 'import'} `,
        `'${(node.path.nodes[0] as any).string}'`
      ];
    default:
      console.error(node);
      // @ts-expect-error
      throw new Error(node.nodeName + ' is not supported yet');
  }
};

const printers = {
  [AST_FORMAT]: {
    print: printStylus
  }
};

module.exports = {
  languages,
  parsers,
  printers
};
