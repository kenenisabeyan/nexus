// The whole point of this file: nothing outside packages/ai should ever
// import a provider-specific type. The application depends on this
// interface; it never depends on "the Anthropic SDK shape" or "the OpenAI
// SDK shape" directly. That's what makes swapping or adding a provider
// later a change inside this package, not a change everywhere Nexus calls
// an LLM.

export interface CompletionRequest {
  systemPrompt?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens: number;
  /** 0.0–1.0. Omitted = provider default. Verification/classification work
   *  should generally use low values; this is a request-level knob, not a
   *  provider-level one, because different call sites want different
   *  determinism. */
  temperature?: number;
}

export interface CompletionResult {
  text: string;
  stopReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  /** Which concrete provider+model actually served this request — needed
   *  for cost tracking and for debugging when a fallback provider was used
   *  instead of the primary one. */
  providerId: string;
  model: string;
}

export class ModelProviderError extends Error {
  constructor(
    message: string,
    public readonly providerId: string,
    public readonly retryable: boolean,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ModelProviderError";
  }
}

export class ModelAuthenticationError extends ModelProviderError {
  constructor(providerId: string, cause?: unknown) {
    super(`Authentication failed for provider "${providerId}" — check the configured API key.`, providerId, false, cause);
    this.name = "ModelAuthenticationError";
  }
}

export interface ModelProvider {
  readonly id: string;
  complete(request: CompletionRequest): Promise<CompletionResult>;
  /** Cheap, no-token-spend check that credentials/connectivity are valid.
   *  Distinct from complete() so the gateway can health-check providers
   *  without burning tokens on every startup. */
  healthCheck(): Promise<{ healthy: boolean; detail: string }>;
}
