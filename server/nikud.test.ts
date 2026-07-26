import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { addNikud } from "./nikud";

describe("addNikud", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty string for empty input", async () => {
    const result = await addNikud("");
    expect(result).toBe("");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should return whitespace-only input unchanged", async () => {
    const result = await addNikud("   ");
    expect(result).toBe("   ");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should call Dicta API with correct parameters", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            nakdan: { word: "שלום", options: [{ w: "שָׁלוֹם" }] },
            str: "שלום",
            pStr: "שלום",
            sep: false,
          },
          {
            nakdan: { word: " ", options: [], sep: true },
            str: " ",
            pStr: " ",
            sep: true,
          },
          {
            nakdan: { word: "עולם", options: [{ w: "עוֹלָם" }] },
            str: "עולם",
            pStr: "עולם",
            sep: false,
          },
        ],
      }),
    });

    const result = await addNikud("שלום עולם");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://nakdan-u1-0.loadbalancer.dicta.org.il/api",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );

    // Verify the body contains correct params
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.task).toBe("nakdan");
    expect(callBody.data).toBe("שלום עולם");
    expect(callBody.genre).toBe("modern");
    expect(callBody.useTokenization).toBe(true);

    expect(result).toBe("שָׁלוֹם עוֹלָם");
  });

  it("should return original text on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const result = await addNikud("שלום עולם");
    expect(result).toBe("שלום עולם");
  });

  it("should return original text on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await addNikud("שלום עולם");
    expect(result).toBe("שלום עולם");
  });

  it("should handle words with no nikud options", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            nakdan: { word: "NLP", options: [] },
            str: "NLP",
            pStr: "NLP",
            sep: false,
          },
        ],
      }),
    });

    const result = await addNikud("NLP");
    expect(result).toBe("NLP");
  });

  it("should pass genre parameter correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            nakdan: { word: "שלום", options: [{ w: "שָׁלוֹם" }] },
            str: "שלום",
            pStr: "שלום",
            sep: false,
          },
        ],
      }),
    });

    await addNikud("שלום", "poetry");

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.genre).toBe("poetry");
  });
});
