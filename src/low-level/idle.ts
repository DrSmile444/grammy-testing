/**
 * Tracks the set of in-flight promises returned through the testing
 * transformer. `idle()` resolves once the set is empty — including
 * after handling chained API calls scheduled while draining.
 *
 * Promises are removed on both fulfillment and rejection so that
 * `idle()` is robust against bot error paths.
 */
export class IdleTracker {
  private readonly tracked = new Set<Promise<unknown>>();

  /**
   * Track a promise. Removes itself from the set on settle.
   * @param promise - Promise returned through the transformer.
   * @returns The same promise (so the transformer can return it directly).
   */
  track<T>(promise: Promise<T>): Promise<T> {
    this.tracked.add(promise);

    const remove = (): void => {
      this.tracked.delete(promise);
    };

    // Use then-with-both-handlers (not .finally) so we don't
    // generate a chained promise that re-throws and reports as
    // an unhandled rejection when the bot ignores the rejection.
    // eslint-disable-next-line promise/catch-or-return -- both handlers attached, chain cannot reject
    promise.then(remove, remove);

    return promise;
  }

  /**
   * Resolve once every tracked promise has settled. If draining one
   * batch causes new promises to be tracked, drain again until the
   * set is truly empty.
   */
  async idle(): Promise<void> {
    while (this.tracked.size > 0) {
      const snapshot = [...this.tracked];

      // eslint-disable-next-line no-await-in-loop -- drain pass-by-pass on purpose
      await Promise.allSettled(snapshot);
    }
  }
}
