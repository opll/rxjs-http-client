// simple script to prepare a package.json file for the "dist" folder

const packageJson = require('../package.json');

// fixed values for package.json
const template = {
  module: 'rxjs-http-client.esm.js',
  exports: 'rxjs-http-client.esm.js',
  type: 'module',
  files: ['.'],
  types: './index.d.ts',
  scripts: {},
  eslintConfig: {},
  browserslist: {},
  devDependencies: {},
};

const outfile = { ...packageJson, ...template };

console.log(JSON.stringify(outfile, null, 2));
