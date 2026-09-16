// Flat config: base JS + typed TS rules + react-hooks (exhaustive-deps).
// The `eslint-disable react-hooks/exhaustive-deps` comments in CombatScreen /
// DungeonScreen are load-bearing documentation of deferred-timer closures —
// they now resolve against the real plugin instead of silently doing nothing.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'src/vite-env.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
);
