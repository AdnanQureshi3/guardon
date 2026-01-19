// build-opa-wasm.js
require('esbuild').build({
  entryPoints: ['node_modules/@open-policy-agent/opa-wasm/dist/opa-wasm-browser.esm.js'],
  bundle: true,
  format: 'esm',
  outfile: 'src/lib/opa-wasm-bundle.js',
  minify: false,
  platform: 'browser',
  target: ['es2020'],
}).catch(() => process.exit(1));
