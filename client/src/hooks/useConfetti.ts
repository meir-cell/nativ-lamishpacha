import { useCallback } from "react";
import confetti from "canvas-confetti";

/**
 * Custom hook that fires a celebratory confetti animation.
 * Uses multiple bursts with gold/amber theme colors matching the course design.
 */
export function useConfetti() {
  const fire = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    // Gold/amber themed colors matching the course palette
    const colors = ["#F0C040", "#C9A84C", "#FFD700", "#FFA500", "#4CAF50", "#2196F3"];

    // Initial big burst from center
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.6 },
      colors,
      startVelocity: 45,
      gravity: 1.2,
      ticks: 200,
      shapes: ["circle", "square"],
      scalar: 1.2,
    });

    // Continuous side bursts
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      // Left side
      confetti({
        particleCount: 25,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors,
        startVelocity: 35,
        gravity: 1,
        ticks: 150,
      });

      // Right side
      confetti({
        particleCount: 25,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors,
        startVelocity: 35,
        gravity: 1,
        ticks: 150,
      });
    }, 250);

    // Star burst from top after a short delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 360,
        origin: { x: 0.5, y: 0.2 },
        colors,
        startVelocity: 25,
        gravity: 0.8,
        ticks: 200,
        shapes: ["star"],
        scalar: 1.5,
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return { fire };
}
