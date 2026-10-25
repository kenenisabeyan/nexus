import { ModelProviderError, type ModelProvider, type CompletionRequest, type CompletionResult } from "./types.js";

export interface ModelGatewayOptions {
  providers: ModelProvider[];
}

export class NoHealthyProviderError extends Error {
  constructor(public readonly attempts: Array<{ providerId: string; error: string }>) {
    super(`All ${attempts.length} configured provider(s) failed: ${attempts.map((a) => `${a.providerId} (${a.error})`).join("; ")}`);
    this.name = "NoHealthyProviderError";
  }
}

/**
 * The Model Gateway is the single place in Nexus that knows there is more
 * than one possible AI provider. Every call site elsewhere in the codebase
 * depends on this class and on the ModelProvider interface — never on a
 * concrete provider directly — which is what Rule 8 of the master prompt
 * ("never couple the platform to one AI provider") actually requires in
 * code, not just in a diagram.
 *
 * Deliberately simple for this milestone: providers are tried in the order
 * given, first success wins. Cost-aware routing, token budgets, and prompt
 * caching are named in the master prompt (Section 32) as real requirements
 * but are correctly out of scope until there is more than one real,
 * credentialed provider to route between — building a router today would
 * be routing logic with nothing to route to.
 */
export class ModelGateway {
  private readonly providers: ModelProvider[];

  constructor(options: ModelGatewayOptions) {
    if (options.providers.length === 0) {
      throw new Error("ModelGateway requires at least one provider.");
    }
    this.providers = options.providers;
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const attempts: Array<{ providerId: string; error: string }> = [];

    for (const provider of this.providers) {
      try {
        return await provider.complete(request);
      } catch (err) {
        attempts.push({
          providerId: provider.id,
          error: err instanceof Error ? err.message : String(err),
        });
        // A non-retryable ModelProviderError from one provider still means
        // "try the next provider in the fallback chain" at the gateway
        // level, even though it meant "give up" inside that one provider's
        // own internal retry loop. Those are different questions.
        continue;
      }
    }

    throw new NoHealthyProviderError(attempts);
  }

  async healthCheckAll(): Promise<Array<{ providerId: string; healthy: boolean; detail: string }>> {
    return Promise.all(
      this.providers.map(async (provider) => {
        const result = await provider.healthCheck();
        return { providerId: provider.id, ...result };
      })
    );
  }
}

export { ModelProviderError };
