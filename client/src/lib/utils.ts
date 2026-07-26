import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Lesson } from "./courseData";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Calculate estimated TTS duration from lesson word count (~120 words/min Hebrew) */
export function getLessonDuration(lesson: Lesson): string {
  const allText = [
    `${lesson.title} ${lesson.subtitle} ${lesson.content.intro}`,
    ...lesson.content.sections.map(s => `${s.title} ${s.highlight || ""} ${s.text} ${s.example || ""}`),
    lesson.keyPoints.join(" "),
    lesson.content.summary,
  ].join(" ");
  const words = allText.split(/\s+/).length;
  const minutes = Math.ceil(words / 120);
  return `כ-${minutes} דקות`;
}
