run_spec(__dirname, { tabWidth: 4 });

run_spec(__dirname, {
  tabWidth: 4,
  parserOptions: {
    collapseBlankLines: true
  }
}, ["collapsed"]);
