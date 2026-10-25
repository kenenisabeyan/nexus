import { describe, it, expect } from "vitest";
import { ModelGateway, NoHealthyProviderError } from "./ModelGateway.js";
import type { ModelProvider, CompletionRequest, CompletionResult } from "./types.js";

function fakeProvider(id: string, behavior: "succeed" | "fail"): ModelProvider {
  return {
    id,
    async complete(_req: CompletionRequest): Promise<CompletionResult> {
      if (behavior === "fail") throw new Error(`${id} is down`);
      return {
        text: `response from ${id}`,
        stopReason: "end_turn",
        usage: { inputTokens: 1, outputTokens: 1 },
        providerId: id,
        model: "fake-model",
      };
    },
    async healthCheck() {
      return behavior === "succeed" ? { healthy: true, detail: "ok" } : { healthy: false, detail: "down" };
    },
  };
}

describe("ModelGateway", () => {
  it("throws immediately if constructed with zero providers", () => {
    expect(() => new ModelGateway({ providers: [] })).toThrow(/at least one provider/);
  });

  it("uses the first provider when it succeeds, never touching the second", async () => {
    let secondCalled = false;
    const first = fakeProvider("primary", "succeed");
    const second: ModelProvider = {
      ...fakeProvider("fallback", "succeed"),
      complete: async (req) => {
        secondCalled = true;
        return fakeProvider("fallback", "succeed").complete(req);
      },
    };
    const gateway = new ModelGateway({ providers: [first, second] });

    const result = await gateway.complete({ messages: [{ role: "user", content: "hi" }], maxTokens: 10 });
    expect(result.providerId).toBe("primary");
    expect(secondCalled).toBe(false);
  });

  it("falls back to the second provider when the first fails", async () => {
    const gateway = new ModelGateway({ providers: [fakeProvider("primary", "fail"), fakeProvider("fallback", "succeed")] });

    const result = await gateway.complete({ messages: [{ role: "user", content: "hi" }], maxTokens: 10 });
    expect(result.providerId).toBe("fallback");
  });

  it("throws NoHealthyProviderError, listing every attempt, when all providers fail", async () => {
    const gateway = new ModelGateway({ providers: [fakeProvider("a", "fail"), fakeProvider("b", "fail")] });

    await expect(gateway.complete({ messages: [{ role: "user", content: "hi" }], maxTokens: 10 })).rejects.toThrow(NoHealthyProviderError);
    try {
      await gateway.complete({ messages: [{ role: "user", content: "hi" }], maxTokens: 10 });
    } catch (err) {
      expect(err).toBeInstanceOf(NoHealthyProviderError);
      expect((err as NoHealthyProviderError).attempts).toEqual([
        { providerId: "a", error: "a is down" },
        { providerId: "b", error: "b is down" },
      ]);
    }
  });

  it("healthCheckAll reports every provider's status independently, not just the first", async () => {
    const gateway = new ModelGateway({ providers: [fakeProvider("healthy-one", "succeed"), fakeProvider("broken-one", "fail")] });

    const results = await gateway.healthCheckAll();
    expect(results).toEqual([
      { providerId: "healthy-one", healthy: true, detail: "ok" },
      { providerId: "broken-one", healthy: false, detail: "down" },
    ]);
  });
});
