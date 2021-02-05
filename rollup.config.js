import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'remus.js',
  output: {
    name: 'remus',
    file: './dist/remus.js',
    format: 'cjs'
  },
  external: ['xml2js'],
  plugins: [
    nodeResolve(),
    commonjs()
  ]
};
