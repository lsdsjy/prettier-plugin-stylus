// source: https://github.com/prettier/prettier/blob/ee2839bacbf6a52d004fa2f0373b732f6f191ccc/tests_config/raw-serializer.js
'use strict';

const RAW = Symbol.for('raw');

module.exports = {
  print(val) {
    return val[RAW];
  },
  // serialize(val, config, indentation, depth, refs, printer) {
  //   // `printer` is a function that serializes a value using existing plugins.
  //   return val[RAW];
  // },
  test(val) {
    return (
      val &&
      Object.prototype.hasOwnProperty.call(val, RAW) &&
      typeof val[RAW] === 'string'
    );
  }
};
