import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: false,
    banner: { js: '/// <reference types="./index.d.ts" />' },
  },
  {
    entry: { 'low-level': 'src/low-level.ts' },
    format: ['esm'],
    dts: true,
    clean: false,
    sourcemap: false,
    banner: { js: '/// <reference types="./low-level.d.ts" />' },
  },
  {
    entry: {
      index: 'src/index.ts',
      'low-level': 'src/low-level.ts',
    },
    format: ['cjs'],
    dts: true,
    clean: false,
    sourcemap: false,
  },
]);
