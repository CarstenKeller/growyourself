import { defineConfig } from 'vitest/config';

// Fixed time zone so DST cases in calendar tests are reproducible.
process.env.TZ = 'Europe/Berlin';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/storage/**'],
      thresholds: {
        'src/domain/rules.ts': { branches: 100, functions: 100, lines: 100, statements: 100 },
      },
    },
  },
});
