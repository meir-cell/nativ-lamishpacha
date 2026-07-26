import { describe, it, expect } from "vitest";

describe("OpenAI TTS API Key Validation", () => {
  it("should have OPENAI_API_KEY set", () => {
    expect(process.env.OPENAI_API_KEY).toBeDefined();
    expect(process.env.OPENAI_API_KEY!.startsWith("sk-")).toBe(true);
  });

  it("should be able to reach OpenAI TTS endpoint", async () => {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: "test",
        voice: "nova",
      }),
    });

    // 200 means the key is valid and TTS works
    // 429 means rate limited but key is valid
    // 401 means invalid key
    expect([200, 429]).toContain(response.status);
  });
});
