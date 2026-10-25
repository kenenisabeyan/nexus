import { describe, it, expect, vi } from "vitest";
import { ClaudeProvider } from "./ClaudeProvider.js";
import { ModelAuthenticationError, ModelProviderError } from "../types.js";

// This is not a guessed error shape — it is the literal, unmodified body
// returned by a real, live, unauthenticated request to
// https://api.anthropic.com/v1/messages made during development of this
// provider (see IMPLEMENTATION_LEDGER.md for the exact curl transcript).
const REAL_CAPTURED_401_BODY = {
  type: "error",
  error: { type: "authentication_error", message: "x-api-key header is required" },
  request_id: "req_011Ce7meDp1MzFBQk7yDwDVJ",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function realisticSuccessBody(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "msg_01ABC",
    type: "message",
    role: "assistant",
    content: [{ type: "text", text: "This claim is corroborated by two independent sources." }],
    model: "claude-sonnet-4-6",
    stop_reason: "end_turn",
    usage: { input_tokens: 42, output_tokens: 11 },
    ...overrides,
  };
}

describe("ClaudeProvider", () => {
  it("throws ModelAuthenticationError immediately, without any network call, when no API key is configured", async () => {
    const fetchImpl = vi.fn();
    const provider = new ClaudeProvider({ apiKey: undefined, fetchImpl });

    await expect(provider.complete({ messages: [{ role: "user", content: "test" }], maxTokens: 10 })).rejects.toThrow(ModelAuthenticationError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends the correct request shape to the real Anthropic Messages API endpoint", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(realisticSuccessBody()));
    const provider = new ClaudeProvider({ apiKey: "sk-ant-test-key", model: "claude-sonnet-4-6", fetchImpl });

    await provider.complete({
      systemPrompt: "You are a verification assistant.",
      messages: [{ role: "user", content: "Is this claim true?" }],
      maxTokens: 500,
      temperature: 0.2,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-api-key": "sk-ant-test-key",
          "anthropic-version": "2023-06-01",
        }),
      })
    );
    const [, options] = fetchImpl.mock.calls[0];
    const sentBody = JSON.parse(options.body);
    expect(sentBody).toEqual({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: "You are a verification assistant.",
      messages: [{ role: "user", content: "Is this claim true?" }],
      temperature: 0.2,
    });
  });

  it("parses a successful response into a CompletionResult correctly", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(realisticSuccessBody()));
    const provider = new ClaudeProvider({ apiKey: "sk-ant-test-key", fetchImpl });

    const result = await provider.complete({ messages: [{ role: "user", content: "test" }], maxTokens: 10 });

    expect(result.text).toBe("This claim is corroborated by two independent sources.");
    expect(result.stopReason).toBe("end_turn");
    expect(result.usage).toEqual({ inputTokens: 42, outputTokens: 11 });
    expect(result.providerId).toBe("claude");
    expect(result.model).toBe("claude-sonnet-4-6");
  });

  it("throws ModelAuthenticationError on a real, live-captured 401 response, without retrying", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(REAL_CAPTURED_401_BODY, 401));
    const provider = new ClaudeProvider({ apiKey: "sk-ant-invalid-key", fetchImpl });

    await expect(provider.complete({ messages: [{ role: "user", content: "test" }], maxTokens: 10 })).rejects.toThrow(ModelAuthenticationError);
    expect(fetchImpl).toHaveBeenCalledTimes(1); // auth errors are not retryable — one attempt, not maxRetries+1
  });

  it("retries on a 429 rate-limit response, then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ type: "error", error: { type: "rate_limit_error", message: "rate limited" } }, 429))
      .mockResolvedValueOnce(jsonResponse(realisticSuccessBody()));
    const provider = new ClaudeProvider({ apiKey: "sk-ant-test-key", fetchImpl, maxRetries: 2 });

    const result = await provider.complete({ messages: [{ role: "user", content: "test" }], maxTokens: 10 });

    expect(result.text).toContain("corroborated");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("gives up and throws after exhausting all retries on persistent 5xx errors", async () => {
    const fetchImpl = vi.fn().mockImplementation(() =>
      Promise.resolve(jsonResponse({ type: "error", error: { type: "api_error", message: "internal error" } }, 500))
    );
    const provider = new ClaudeProvider({ apiKey: "sk-ant-test-key", fetchImpl, maxRetries: 2 });

    await expect(provider.complete({ messages: [{ role: "user", content: "test" }], maxTokens: 10 })).rejects.toThrow(ModelProviderError);
    expect(fetchImpl).toHaveBeenCalledTimes(3); // initial attempt + 2 retries
  });

  it("does not retry on a non-retryable 400 (bad request) error", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ type: "error", error: { type: "invalid_request_error", message: "bad request" } }, 400));
    const provider = new ClaudeProvider({ apiKey: "sk-ant-test-key", fetchImpl, maxRetries: 2 });

    await expect(provider.complete({ messages: [{ role: "user", content: "test" }], maxTokens: 10 })).rejects.toThrow(ModelProviderError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  describe("healthCheck", () => {
    it("reports unhealthy without a network call when no API key is configured", async () => {
      const fetchImpl = vi.fn();
      const provider = new ClaudeProvider({ apiKey: undefined, fetchImpl });

      const result = await provider.healthCheck();
      expect(result.healthy).toBe(false);
      expect(result.detail).toMatch(/API key/);
      expect(fetchImpl).not.toHaveBeenCalled();
    });

    it("distinguishes 'reachable but unauthenticated' from 'unreachable' — using the real captured error", async () => {
      const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(REAL_CAPTURED_401_BODY, 401));
      const provider = new ClaudeProvider({ apiKey: "sk-ant-invalid-key", fetchImpl });

      const result = await provider.healthCheck();
      expect(result.healthy).toBe(false);
      expect(result.detail).toMatch(/authentication failed/i);
    });

    it("reports healthy on a genuine successful response", async () => {
      const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(realisticSuccessBody()));
      const provider = new ClaudeProvider({ apiKey: "sk-ant-test-key", fetchImpl });

      const result = await provider.healthCheck();
      expect(result.healthy).toBe(true);
    });
  });

  it("uses ANTHROPIC_MODEL from the environment when no explicit model is passed", async () => {
    const original = process.env.ANTHROPIC_MODEL;
    process.env.ANTHROPIC_MODEL = "claude-opus-4-8";
    try {
      const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(realisticSuccessBody({ model: "claude-opus-4-8" })));
      const provider = new ClaudeProvider({ apiKey: "sk-ant-test-key", fetchImpl });
      await provider.complete({ messages: [{ role: "user", content: "test" }], maxTokens: 10 });

      const [, options] = fetchImpl.mock.calls[0];
      expect(JSON.parse(options.body).model).toBe("claude-opus-4-8");
    } finally {
      process.env.ANTHROPIC_MODEL = original;
    }
  });
});
