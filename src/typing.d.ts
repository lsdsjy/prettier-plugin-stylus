declare module 'postcss-styl' {
  import * as postcss from 'postcss';
  function parse(text: string): postcss.Root;
}
