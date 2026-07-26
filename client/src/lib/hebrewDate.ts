/**
 * Convert a number to Hebrew letters (Gematria).
 * Examples: 21 → כ"א, 5786 → ה'תשפ"ו
 */
function numToHebrewLetters(num: number): string {
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hundreds = ["", "ק", "ר", "ש", "ת"];
  const thousands = ["", "א", "ב", "ג", "ד", "ה"];

  if (num >= 1000) {
    const th = Math.floor(num / 1000);
    const remainder = num % 1000;
    if (remainder === 0) return thousands[th] + "'";
    return thousands[th] + "'" + numToHebrewLetters(remainder);
  }

  let result = "";
  if (num >= 100) {
    const h = Math.floor(num / 100);
    if (h <= 4) {
      result += hundreds[h];
    } else {
      // 500=תק, 600=תר, 700=תש, 800=תת, 900=תתק
      result += "ת";
      if (h > 5) result += hundreds[h - 4];
      else if (h === 5) result += "ק";
    }
    num %= 100;
  }

  // Special cases: 15=ט"ו, 16=ט"ז (avoid י"ה and י"ו which spell God's name)
  if (num === 15) return result + 'ט"ו';
  if (num === 16) return result + 'ט"ז';

  if (num >= 10) {
    result += tens[Math.floor(num / 10)];
    num %= 10;
  }

  result += ones[num];

  // Add geresh (') for single letter, gershayim (") before last letter for multiple
  if (result.length === 0) return "";
  if (result.length === 1) return result + "'";
  return result.slice(0, -1) + '"' + result.slice(-1);
}

/**
 * Format a Date as a Hebrew date with letters instead of numbers.
 * Example output: כ"א בסיוון ה'תשפ"ו
 */
export function formatHebrewDate(date: Date): string {
  // Use Intl to get the Hebrew calendar date parts
  const formatter = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const parts = formatter.formatToParts(date);
  const dayNum = parseInt(parts.find((p) => p.type === "day")?.value ?? "1");
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const yearNum = parseInt(parts.find((p) => p.type === "year")?.value ?? "5786");

  const dayHeb = numToHebrewLetters(dayNum);
  const yearHeb = numToHebrewLetters(yearNum);

  return `${dayHeb} ${month} ${yearHeb}`;
}
