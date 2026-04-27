import { environmentConfig } from './config/environment.config';
import { OVERALL_PROJECT_RELEASE_VERSION } from './version';

/**
 * Builds the default startup message with environment and release metadata.
 * @returns Human-readable application greeting.
 */
export function showHello() {
  return `Hello world ${String(environmentConfig.CI)} ${OVERALL_PROJECT_RELEASE_VERSION}`;
}

// eslint-disable-next-line no-console, lintlord/prefer-logger
console.info(showHello());
