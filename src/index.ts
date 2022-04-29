// @ts-ignore
import Parser from 'stylus/lib/parser.js';
import * as postcss from 'postcss';
import * as prettier from 'prettier';
import { ArrayKeys, formatParams } from './utils';
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
    parse: (text) => new Parser(text).parse(),
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

const printStylus: prettier.Printer<Stylus.Node>['print'] = (
  path,
  options,
  print
) => {
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
      return [children(node, 'segments'), ' ', child(node, 'expr')];
    }
    case 'expression': {
      const content = b.join(' ', children(node, 'nodes'));
      if (path.getParentNode()?.nodeName === 'selector') {
        return ['{', content, '}'];
      }
      return content;
    }
    case 'binop': {
      return [child(node, 'left'), ' ', node.op, ' ', child(node, 'right')];
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
      if ((node.val as any).isNull) {
        return node.string;
      } else {
        const parent = path.getParentNode();
        if (parent?.nodeName === 'params') {
          return [node.name, ' = ', child(node, 'val')];
        }
        return child(node, 'val');
      }
    case 'literal':
      return node.string;
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
