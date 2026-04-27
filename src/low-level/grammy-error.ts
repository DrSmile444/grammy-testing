import { GrammyError } from 'grammy';

/**
 * Sugar spec accepted in place of a fully-constructed {@link GrammyError}.
 */
export interface GrammyErrorSpec {
  code: number;
  description: string;
  parameters?: Record<string, unknown>;
}

/**
 * Upgrades a {@link GrammyErrorSpec} (or passes through an existing
 * {@link GrammyError}) into a real {@link GrammyError} that the
 * transformer can reject API calls with.
 *
 * The `method` argument is the grammY API method that the resulting
 * error will be associated with — supplied by the override site, not
 * the user.
 * @param errorOrSpec - Real {@link GrammyError} or sugar spec.
 * @param method - API method this error pertains to.
 * @returns A real {@link GrammyError}.
 */
export function toGrammyError(errorOrSpec: GrammyError | GrammyErrorSpec, method: string): GrammyError {
  if (errorOrSpec instanceof GrammyError) {
    return errorOrSpec;
  }

  const { code, description, parameters } = errorOrSpec;

  return new GrammyError(
    description,
    {
      ok: false,
      error_code: code,
      description,
      parameters,
    },
    method,
    {},
  );
}
