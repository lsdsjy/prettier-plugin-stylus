import parser from 'postcss-styl';
import * as postcss from 'postcss';
import * as prettier from 'prettier';
const b = prettier.doc.builders;

const languages: prettier.SupportLanguage[] = [
  {
    extensions: ['.styl'],
    name: 'Stylus',
    parsers: ['stylus']
  }
];

const AST_FORMAT = 'postcss-stylus-ast'

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

const printStylus: prettier.Printer<postcss.Node>['print'] = (
  path,
  options,
  print
) => {
  const node = path.getValue();

  switch (node.type) {
    case 'root':
      return path.map(print, 'nodes');
    case 'rule':
      const rule = node as postcss.Rule;
      const selectors = b.join(b.hardline, rule.selectors);
      return [
        selectors,
        b.indent([b.hardline, b.join(b.hardline, path.map(print, 'nodes'))])
      ];
    case 'decl':
      const decl = node as postcss.Declaration;
      return [decl.prop, ' ', decl.value];
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
