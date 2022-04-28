import parser from 'postcss-styl';
import * as postcss from 'postcss';
import * as prettier from 'prettier';
import { formatParams } from './utils';
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
    parse: (text) => parser.parse(text),
    astFormat: AST_FORMAT,
    locStart: () => {
      throw new Error();
    },
    locEnd: () => {
      throw new Error();
    }
  }
};

function childBlock(lines: prettier.Doc[]) {
  return b.indent([b.hardline, b.join(b.hardline, lines)]);
}

const printStylus: prettier.Printer<postcss.Node>['print'] = (
  path,
  options,
  print
) => {
  const node = path.getValue();

  switch (node.type) {
    case 'root':
      return [
        b.join([b.hardline, b.hardline], path.map(print, 'nodes')),
        b.hardline
      ];
    case 'rule': {
      const rule = node as postcss.Rule;
      const selectors = b.join(b.hardline, rule.selectors);
      return [selectors, childBlock(path.map(print, 'nodes'))];
    }
    case 'atrule': {
      // postcss-styl parses mixins/functions as AtRule
      const atrule = node as postcss.AtRule;
      const name = [atrule.name, formatParams(atrule.params)];
      if (atrule.nodes) {
        // mixins/functions declaration
        return [name, childBlock(path.map(print, 'nodes'))];
      } else {
        // expansion or evaluation
        return name;
      }
    }
    case 'decl': {
      const decl = node as postcss.Declaration;
      return [decl.prop, ' ', decl.value];
    }
    default:
      return '';
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
