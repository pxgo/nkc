import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.{ts,js,json}'],
  bundle: false,
  format: ['cjs'],
  target: 'es2022',
  outDir: 'dist',
  clean: false,
  sourcemap: false,
  minify: false, // 服务端代码通常不压缩，方便报错排查
  loader: { '.json': 'copy' },
});
