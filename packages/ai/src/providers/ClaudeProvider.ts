import { ModelAuthenticationError, ModelProviderError, type ModelProvider, type CompletionRequest, type CompletionResult } from "../types.js";

// Real integration against https://api.anthropic.com/v1/messages — the
// request/response shapes below were verified against the live API during
// development of this provider (see IMPLEMENTATION_LEDGER.md for the exact
// unauthenticated-request transcript proving connectivity and error shape).
// This environment has no API key configured, so authenticated completion
// calls are untested live; the request-building and response-parsing logic
// is unit-tested against both a realistic success payload and the real,
// live-captured 401 error payload.

interface AnthropicSuccessResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<{ type: string; text?: string }>;
  model: string;
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
}

interface AnthropicErrorResponse {
  type: "error";
  error: { type: string; message: string };
}

export interface ClaudeProviderOptions {
  apiKey: string | undefined;
  model?: string;
  apiUrl?: string;
  fetchImpl?: typeof fetch;
  maxRetries?: number;
}

const RETRYABLE_ERROR_TYPES = new Set(["rate_limit_error", "overloaded_error", "api_error"]);

export class ClaudeProvider implements ModelProvider {
  readonly id = "claude";
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly apiUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly maxRetries: number;

  constructor(options: ClaudeProviderOptions) {
    this.apiKey = options.apiKey;
    // Deliberately configurable rather than hardcoded to a single model
    // string — the Model Gateway's whole purpose includes "model
    // selection" (master prompt, Section 18), and hardcoding here would
    // undermine that at the one place it matters most.
    this.model = options.model ?? process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
    this.apiUrl = options.apiUrl ?? "https://api.anthropic.com/v1/messages";
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.maxRetries = options.maxRetries ?? 2;
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    if (!this.apiKey) {
      throw new ModelAuthenticationError(this.id, new Error("No API key configured (ANTHROPIC_API_KEY unset)"));
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.attemptComplete(request);
      } catch (err) {
        lastError = err;
        if (err instanceof ModelProviderError && !err.retryable) throw err;
        if (attempt < this.maxRetries) {
          // Simple exponential backoff — a full jittered/configurable
          // backoff strategy is a reasonable later refinement, not a
          // blocker for this to be real, working retry behavior.
          await new Promise((r) => setTimeout(r, 250 * 2 ** attempt));
        }
      }
    }
    throw lastError;
  }

  private async attemptComplete(request: CompletionRequest): Promise<CompletionResult> {
    const res = await this.fetchImpl(this.apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: request.maxTokens,
        system: request.systemPrompt,
        messages: request.messages,
        temperature: request.temperature,
      }),
    });

    const body = await res.json();

    if (!res.ok) {
      const errBody = body as AnthropicErrorResponse;
      if (res.status === 401) {
        throw new ModelAuthenticationError(this.id, errBody);
      }
      const retryable = res.status === 429 || res.status >= 500 || RETRYABLE_ERROR_TYPES.has(errBody.error?.type);
      throw new ModelProviderError(
        errBody.error?.message ?? `Anthropic API request failed with status ${res.status}`,
        this.id,
        retryable,
        errBody
      );
    }

    const success = body as AnthropicSuccessResponse;
    const text = success.content.find((block) => block.type === "text")?.text ?? "";

    return {
      text,
      stopReason: success.stop_reason,
      usage: { inputTokens: success.usage.input_tokens, outputTokens: success.usage.output_tokens },
      providerId: this.id,
      model: success.model,
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; detail: string }> {
    if (!this.apiKey) {
      return { healthy: false, detail: "No API key configured (ANTHROPIC_API_KEY unset)" };
    }
    try {
      // A minimal real request — 1 max_tokens keeps any successful call
      // essentially free, while still genuinely exercising auth and
      // connectivity rather than just checking that the key string exists.
      await this.attemptComplete({ messages: [{ role: "user", content: "hi" }], maxTokens: 1 });
      return { healthy: true, detail: `Reached ${this.apiUrl} and received a valid response` };
    } catch (err) {
      if (err instanceof ModelAuthenticationError) {
        return { healthy: false, detail: "Reachable, but authentication failed — check ANTHROPIC_API_KEY" };
      }
      return { healthy: false, detail: `Health check failed: ${(err as Error).message}` };
    }
  }
}
