/**
 * Dicta Nakdan API helper — adds nikud (vowel diacritics) to Hebrew text.
 * Uses the free Dicta API (https://nakdan.dicta.org.il).
 * This improves TTS pronunciation accuracy for Hebrew narration.
 * Also applies pronunciation overrides from the database.
 */

import { getDb } from "./db";
import { pronunciationOverrides } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const DICTA_API_URL = "https://nakdan-u1-0.loadbalancer.dicta.org.il/api";

// Cache for pronunciation overrides (refreshed every 5 minutes)
let overridesCache: { originalWord: string; replacement: string }[] | null = null;
let overridesCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load active pronunciation overrides from DB (with caching)
 */
async function getOverrides(): Promise<{ originalWord: string; replacement: string }[]> {
  const now = Date.now();
  if (overridesCache && now - overridesCacheTime < CACHE_TTL) {
    return overridesCache;
  }
  try {
    const db = await getDb();
    if (!db) return overridesCache ?? [];
    const result = await db
      .select({
        originalWord: pronunciationOverrides.originalWord,
        replacement: pronunciationOverrides.replacement,
      })
      .from(pronunciationOverrides)
      .where(eq(pronunciationOverrides.isActive, true));
    overridesCache = result;
    overridesCacheTime = now;
    return result;
  } catch (e) {
    console.error("Failed to load pronunciation overrides:", e);
    return overridesCache ?? [];
  }
}

/**
 * Invalidate the pronunciation overrides cache.
 * Call this after add/update/delete operations.
 */
export function invalidateOverridesCache(): void {
  overridesCache = null;
  overridesCacheTime = 0;
}

/**
 * Strip parenthesized English text from Hebrew narration.
 * When narrating in Hebrew, skip content in parentheses that is primarily English/Latin.
 * Keep parentheses that contain Hebrew text.
 * Examples:
 *   "תכנות נוירו-לשוני (Neuro-Linguistic Programming)" → "תכנות נוירו-לשוני"
 *   "עיגון (Anchoring)" → "עיגון"
 *   "עיגון (טכניקה חשובה)" → "עיגון (טכניקה חשובה)" (kept — Hebrew content)
 */
export function stripEnglishParentheses(text: string): string {
  // Match parentheses whose content is primarily Latin/English (>50% Latin chars)
  return text.replace(/\s*\(([^)]+)\)/g, (match, inner: string) => {
    const latinChars = (inner.match(/[A-Za-z]/g) || []).length;
    const hebrewChars = (inner.match(/[\u0590-\u05FF]/g) || []).length;
    // If more Latin than Hebrew characters, strip the entire parenthetical
    if (latinChars > hebrewChars) {
      return "";
    }
    return match; // Keep Hebrew parenthetical content
  });
}

/**
 * Apply pronunciation overrides to text before TTS.
 * Replaces whole words/phrases according to the overrides dictionary.
 * Uses word-boundary matching to avoid replacing substrings inside other words.
 */
export async function applyPronunciationOverrides(text: string): Promise<string> {
  // First, strip English parenthetical content (narrator skips English in parentheses)
  let processed = stripEnglishParentheses(text);

  const overrides = await getOverrides();
  if (overrides.length === 0) return convertNumbersToHebrew(processed);

  let result = processed;
  for (const { originalWord, replacement } of overrides) {
    const escaped = originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // For Hebrew words: use lookahead/lookbehind for non-Hebrew chars or start/end
    // For Latin words: use \b word boundaries
    const isHebrew = /[\u0590-\u05FF]/.test(originalWord);
    let regex: RegExp;
    if (isHebrew) {
      // Match only when surrounded by non-Hebrew chars, spaces, or start/end
      regex = new RegExp(`(?<![\\u0590-\\u05FF])${escaped}(?![\\u0590-\\u05FF])`, 'g');
    } else {
      regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    }
    result = result.replace(regex, replacement);
  }

  // Convert remaining digit numbers to Hebrew words
  result = convertNumbersToHebrew(result);

  // Transliterate any remaining English words to Hebrew phonetics
  result = transliterateEnglishToHebrew(result);

  return result;
}

/**
 * Convert digit numbers to Hebrew words for TTS.
 * Handles numbers 0-9999 and common patterns like percentages.
 */
function convertNumbersToHebrew(text: string): string {
  const ones = ["", "אחד", "שניים", "שלושה", "ארבעה", "חמישה", "שישה", "שבעה", "שמונה", "תשעה"];
  const onesF = ["", "אחת", "שתיים", "שלוש", "ארבע", "חמש", "שש", "שבע", "שמונה", "תשע"];
  const teens = ["עשר", "אחת עשרה", "שתים עשרה", "שלוש עשרה", "ארבע עשרה", "חמש עשרה", "שש עשרה", "שבע עשרה", "שמונה עשרה", "תשע עשרה"];
  const tens = ["", "עשר", "עשרים", "שלושים", "ארבעים", "חמישים", "שישים", "שבעים", "שמונים", "תשעים"];
  const hundreds = ["", "מאה", "מאתיים", "שלוש מאות", "ארבע מאות", "חמש מאות", "שש מאות", "שבע מאות", "שמונה מאות", "תשע מאות"];

  function numberToHebrew(n: number): string {
    if (n === 0) return "אפס";
    if (n < 0) return "מינוס " + numberToHebrew(-n);
    
    let parts: string[] = [];
    
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      if (thousands === 1) parts.push("אלף");
      else if (thousands === 2) parts.push("אלפיים");
      else parts.push(onesF[thousands] + " אלפים");
      n %= 1000;
    }
    
    if (n >= 100) {
      parts.push(hundreds[Math.floor(n / 100)]);
      n %= 100;
    }
    
    if (n >= 10 && n < 20) {
      parts.push(teens[n - 10]);
    } else {
      if (n >= 20) {
        parts.push(tens[Math.floor(n / 10)]);
        n %= 10;
      }
      if (n > 0 && n < 10) {
        parts.push(onesF[n]);
      }
    }
    
    return parts.filter(Boolean).join(" ו");
  }

  // Handle special patterns first: N±M → N פלוס מינוס M
  let result = text.replace(/(\d+)±(\d+)/g, (_, a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    const ha = na <= 9999 ? numberToHebrew(na) : a;
    const hb = nb <= 9999 ? numberToHebrew(nb) : b;
    return `${ha} פלוס מינוס ${hb}`;
  });

  // Replace standalone numbers (not part of URLs or codes)
  result = result.replace(/(?<!\w)(\d+)(?!\w)/g, (match) => {
    const num = parseInt(match, 10);
    if (num > 9999) return match; // Keep very large numbers as-is
    return numberToHebrew(num);
  });

  return result;
}

/**
 * Transliterate remaining English/Latin words to Hebrew phonetics.
 * Uses a simple rule-based approach for common English phoneme patterns.
 * This catches any English words that weren't in the pronunciation overrides dictionary.
 */
function transliterateEnglishToHebrew(text: string): string {
  // Single letter spelling map
  const letterNames: Record<string, string> = {
    a: "איי", b: "בי", c: "סי", d: "די", e: "אי",
    f: "אף", g: "ג׳י", h: "אייצ׳", i: "איי", j: "ג׳יי",
    k: "קיי", l: "אל", m: "אם", n: "אן", o: "או",
    p: "פי", q: "קיו", r: "אר", s: "אס", t: "טי",
    u: "יו", v: "וי", w: "דאבליו", x: "אקס", y: "וואי",
    z: "זד",
  };

  // Handle single English letters (spell them out)
  let result = text.replace(/(?<![A-Za-z])([A-Za-z])(?![A-Za-z])/g, (match) => {
    return letterNames[match.toLowerCase()] || match;
  });

  // Match English words (2+ letters) that remain in the text
  result = result.replace(/\b([A-Za-z]{2,})\b/g, (match) => {
    return englishToHebrewPhonetic(match.toLowerCase());
  });

  return result;
}

/**
 * Simple rule-based English to Hebrew phonetic transliteration.
 * Converts common English letter combinations to Hebrew equivalents.
 */
function englishToHebrewPhonetic(word: string): string {
  // Common multi-letter patterns (order matters - longer patterns first)
  const patterns: [string | RegExp, string][] = [
    [/tion$/,  "שן"],
    [/sion$/,  "ז׳ן"],
    [/ight/,   "ייט"],
    [/ough/,   "אוף"],
    [/ould/,   "וד"],
    [/ness$/,  "נס"],
    [/ment$/,  "מנט"],
    [/able$/,  "אבל"],
    [/ible$/,  "יבל"],
    [/ing$/,   "ינג"],
    [/ous$/,   "אס"],
    [/ive$/,   "יב"],
    [/ure$/,   "ר"],
    [/age$/,   "אג׳"],
    [/ence$/,  "נס"],
    [/ance$/,  "נס"],
    [/th/,     "ת"],
    [/sh/,     "ש"],
    [/ch/,     "צ׳"],
    [/ph/,     "פ"],
    [/wh/,     "וו"],
    [/ck/,     "ק"],
    [/gh/,     ""],
    [/wr/,     "ר"],
    [/kn/,     "נ"],
    [/qu/,     "קוו"],
    [/ee/,     "י"],
    [/ea/,     "י"],
    [/oo/,     "או"],
    [/ou/,     "או"],
    [/ow/,     "או"],
    [/ai/,     "יי"],
    [/ay/,     "יי"],
    [/oi/,     "אוי"],
    [/oy/,     "אוי"],
    [/au/,     "או"],
    [/aw/,     "או"],
    [/ie/,     "י"],
    [/ei/,     "יי"],
  ];

  // Single letter mappings
  const singleMap: Record<string, string> = {
    a: "א", b: "ב", c: "ק", d: "ד", e: "א",
    f: "פ", g: "ג", h: "ה", i: "י", j: "ג׳",
    k: "ק", l: "ל", m: "מ", n: "נ", o: "ו",
    p: "פ", q: "ק", r: "ר", s: "ס", t: "ט",
    u: "א", v: "ו", w: "וו", x: "קס", y: "י",
    z: "ז",
  };

  let result = word;
  // Apply multi-letter patterns
  for (const [pattern, replacement] of patterns) {
    if (typeof pattern === "string") {
      result = result.replace(new RegExp(pattern, "g"), replacement);
    } else {
      result = result.replace(pattern, replacement);
    }
  }

  // Apply single letter mappings for remaining Latin characters
  let hebrewResult = "";
  for (const char of result) {
    if (singleMap[char]) {
      hebrewResult += singleMap[char];
    } else if (/[\u0590-\u05FF\u05F3\u05F4]/.test(char)) {
      // Already Hebrew (from pattern replacement)
      hebrewResult += char;
    } else if (char === " " || char === "-") {
      hebrewResult += char;
    }
    // Skip other characters
  }

  return hebrewResult || word; // Fallback to original if transliteration fails
}

interface DictaNakdanOption {
  w: string; // word with nikud
  levelChoice: number;
  lex: string;
  morph: string;
}

interface DictaNakdanItem {
  nakdan: {
    word: string;
    options: DictaNakdanOption[];
    sep?: boolean;
  };
  str: string;
  pStr: string;
  sep?: boolean;
}

interface DictaNakdanResponse {
  data: DictaNakdanItem[];
}

/**
 * Merge spaced single letters into words.
 * Detects patterns like "א נ ק ו ר י נ ג" (single Hebrew/Latin letters separated by spaces)
 * and merges them into a single word "אנקורינג".
 * This prevents TTS from reading letter-by-letter.
 */
export function mergeSpacedLettersInText(text: string): string {
  // Match 3+ single Hebrew letters separated by single spaces
  // Pattern: single Hebrew letter, space, single Hebrew letter, space, ...
  const hebrewPattern = /(?<![\u0590-\u05FF])([֐-\u05FF] ){2,}[֐-\u05FF](?![\u0590-\u05FF])/g;
  let result = text.replace(hebrewPattern, (match) => {
    return match.replace(/ /g, "");
  });

  // Match 3+ single Latin letters separated by single spaces
  const latinPattern = /(?<![a-zA-Z])([a-zA-Z] ){2,}[a-zA-Z](?![a-zA-Z])/g;
  result = result.replace(latinPattern, (match) => {
    return match.replace(/ /g, "");
  });

  return result;
}

/**
 * Add nikud (vowel diacritics) to Hebrew text using Dicta Nakdan API.
 * @param text - Plain Hebrew text without nikud
 * @param genre - Text genre: "modern" (default), "rabbinic", or "poetry"
 * @param shouldMergeSpacedLetters - Whether to merge spaced letters before processing
 * @returns Text with nikud added
 */
export async function addNikud(text: string, genre: "modern" | "rabbinic" | "poetry" = "modern", shouldMergeSpacedLetters = true): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // Merge spaced letters if enabled (prevents letter-by-letter reading)
  let processedText = shouldMergeSpacedLetters ? mergeSpacedLettersInText(text) : text;

  // Apply pronunciation overrides (word replacements)
  processedText = await applyPronunciationOverrides(processedText);

  // Split long texts into chunks of max 5000 chars (Dicta limit)
  const MAX_CHUNK = 4500;
  if (processedText.length > MAX_CHUNK) {
    const chunks = splitTextIntoChunks(processedText, MAX_CHUNK);
    const results = await Promise.all(chunks.map(chunk => nikudChunk(chunk, genre)));
    return results.join("");
  }

  return nikudChunk(processedText, genre);
}

/**
 * Process a single chunk of text through Dicta API
 */
async function nikudChunk(text: string, genre: string): Promise<string> {
  try {
    const response = await fetch(DICTA_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addmorph: true,
        keepmetagim: true,
        keepqq: false,
        nodageshdefmem: false,
        patachma: false,
        task: "nakdan",
        data: text,
        useTokenization: true,
        genre,
      }),
    });

    if (!response.ok) {
      console.error(`Dicta API error: ${response.status} ${response.statusText}`);
      return text; // Return original text on error
    }

    const result: DictaNakdanResponse = await response.json();
    return extractNikudText(result.data);
  } catch (error) {
    console.error("Dicta Nakdan API error:", error);
    return text; // Return original text on error
  }
}

/**
 * Extract the nikud text from the Dicta API response
 */
function extractNikudText(items: DictaNakdanItem[]): string {
  let result = "";

  for (const item of items) {
    if (item.sep) {
      // Separator item (space, punctuation, newline)
      result += item.str;
    } else {
      // Word item — use the first (best) nikud option
      const options = item.nakdan?.options ?? [];
      if (options.length > 0) {
        let word = options[0].w;
        // Remove nikud from prefix letters ה, ב, ש, ו, ל, מ, כ at ALL positions
        // These prefix letters with heavy nikud (dagesh, patach, shva, etc.)
        // cause TTS to over-emphasize and space them out unnaturally
        word = removeNikudFromPrefixLetters(word);
        result += word;
      } else {
        // No nikud available — keep original
        result += item.str;
      }
    }
  }

  return result;
}

/**
 * Remove nikud (vowel diacritics) from common Hebrew prefix letters at the start of a word.
 * Prefix letters: ה (he), ב (bet), ש (shin), ו (vav), ל (lamed), מ (mem), כ (kaf)
 * When these prefix letters carry heavy nikud (dagesh, patach, kamatz, shva, etc.),
 * TTS engines tend to over-emphasize them, creating an unnatural "spaced" sound.
 * Stripping the nikud from just the prefix letter makes the word flow naturally.
 * Hebrew nikud unicode range: \u05B0-\u05BD, \u05BF, \u05C1, \u05C2, \u05C4, \u05C5, \u05C7
 */
function removeNikudFromPrefixLetters(word: string): string {
  if (!word || word.length < 2) return word;

  const nikudPattern = '[\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]+';
  // Prefix letters:
  // ה (he) = \u05D4, ב (bet) = \u05D1, ש (shin) = \u05E9, ו (vav) = \u05D5
  // ל (lamed) = \u05DC, מ (mem) = \u05DE, כ (kaf) = \u05DB
  const prefixLetters = '\u05D4\u05D1\u05E9\u05D5\u05DC\u05DE\u05DB';

  const firstChar = word.charAt(0);
  if (prefixLetters.includes(firstChar)) {
    // Strip nikud characters to count actual Hebrew letters in the word
    const lettersOnly = word.replace(/[\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g, '');
    // Only treat as prefix if the word has at least 5 Hebrew letters total
    // (1 prefix + 3+ root letters). Short words like שלום (4 letters), בית (3 letters)
    // have the first letter as part of the root, not a prefix.
    if (lettersOnly.length < 5) return word;

    // Check that the next non-nikud character is also a Hebrew letter (confirming this is a prefix)
    const restAfterNikud = word.slice(1).replace(new RegExp(`^${nikudPattern}`), '');
    if (restAfterNikud.length > 0 && /[\u05D0-\u05EA]/.test(restAfterNikud.charAt(0))) {
      // Strip nikud only from the first prefix letter
      return word.replace(new RegExp(`^([${prefixLetters}])(${nikudPattern})`), '$1');
    }
  }
  return word;
}

/**
 * Split text into chunks at sentence/paragraph boundaries
 */
function splitTextIntoChunks(text: string, maxChunk: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxChunk) {
    // Find a good split point (end of sentence or paragraph)
    let splitAt = remaining.lastIndexOf(".", maxChunk);
    if (splitAt < maxChunk * 0.5) {
      splitAt = remaining.lastIndexOf(" ", maxChunk);
    }
    if (splitAt < maxChunk * 0.3) {
      splitAt = maxChunk;
    }

    chunks.push(remaining.slice(0, splitAt + 1));
    remaining = remaining.slice(splitAt + 1);
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}
