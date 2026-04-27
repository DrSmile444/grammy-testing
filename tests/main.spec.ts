import { describe, expect, it } from 'vitest';

import { environmentConfig } from '@config/environment.config';

import { showHello } from '../src/main';
import { OVERALL_PROJECT_RELEASE_VERSION } from '../src/version';

describe('main.ts', () => {
  describe('showHello', () => {
    describe('positive', () => {
      it('returns the greeting with CI flag and release version', () => {
        expect(showHello()).toBe(`Hello world ${String(environmentConfig.CI)} ${OVERALL_PROJECT_RELEASE_VERSION}`);
      });
    });
  });
});
