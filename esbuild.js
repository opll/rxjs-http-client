const { build } = require('esbuild');
const { dtsPlugin } = require('esbuild-plugin-d.ts');

const pkg = require('./package.json');

build({
  bundle: true,
  entryPoints: ['./src/index.ts'],
  // Treat all peerDependencies in package.json as externals to keep bundle size to a minimum
  external: Object.keys({ ...pkg.peerDependencies }),
  logLevel: process.env.NODE_ENV === 'production' ? 'warning' : 'info',
  minify: true,
  sourcemap: process.env.NODE_ENV !== 'production',
  format: 'esm',
  outfile: pkg.module,
  target: ['es2015'],
  watch: process.argv.includes('watch'),
  plugins: [
    dtsPlugin({
      tsconfig: process.argv.includes('watch') ? 'tsconfig.watch.json' : 'tsconfig.gen-dts.json',
      outDir: 'dist',
    }),
  ],
}).finally();
