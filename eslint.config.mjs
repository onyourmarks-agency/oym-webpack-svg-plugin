import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'src/js/**/*.d.ts', 'src/js/**/*.js'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': ['off'],
      '@typescript-eslint/no-unnecessary-type-constraint': ['off'],
      'require-yield': ['off'],
    },
  },
);
