import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EnvironmentConfig } from '@interfaces/environment.interface';

interface EnvironmentConfigModule {
  environmentConfig: EnvironmentConfig;
}

describe('environment.config.ts', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.doUnmock('typed-dotenv');
  });

  describe('module initialization', () => {
    describe('positive', () => {
      it('exports the parsed environment when dotenv loading succeeds', async () => {
        const mockEnvironment = {
          CI: false,
          DEV_API_BASE_URL: 'https://dev-api.example.com',
          DEV_BASE_URL: 'https://dev.example.com',
          LOCAL_API_BASE_URL: 'http://localhost:3001',
          LOCAL_BASE_URL: 'http://localhost:3000',
          PLAYWRIGHT_RECORD: false,
          PROD_API_BASE_URL: 'https://api.example.com',
          PROD_BASE_URL: 'https://example.com',
        } satisfies EnvironmentConfig;

        const typedDotenvConfig = vi.fn(() => ({ env: mockEnvironment, error: undefined }));

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        vi.doMock('typed-dotenv', () => ({
          config: typedDotenvConfig,
        }));

        const { environmentConfig } = await vi.importActual<EnvironmentConfigModule>('../../src/config/environment.config');

        expect(typedDotenvConfig).toHaveBeenCalledTimes(1);
        expect(environmentConfig).toBe(mockEnvironment);
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });
    });

    describe('negative', () => {
      it('logs the failure and exits when dotenv loading fails', async () => {
        const configError = new Error('Invalid env');
        const typedDotenvConfig = vi.fn(() => ({ env: {}, error: configError }));

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const exitError = new Error('process.exit called');

        const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
          throw exitError;
        });

        vi.doMock('typed-dotenv', () => ({
          config: typedDotenvConfig,
        }));

        await expect(vi.importActual<EnvironmentConfigModule>('../../src/config/environment.config')).rejects.toThrow(exitError);

        expect(typedDotenvConfig).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, 'Something wrong with env variables');
        expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, configError);
        expect(processExitSpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
