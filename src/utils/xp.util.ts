/**
 * Shared helpers for XP and rank title computation.
 */

/**
 * Computes an XP score from user stats.
 * XP = totalWins * 100 + bestStreak * 50
 */
export function computeXp(totalWins: number, bestStreak: number): number {
  return totalWins * 100 + bestStreak * 50;
}

/**
 * Derives a rank title from XP.
 * Thresholds match hackathon profile expectations.
 */
export function computeRankTitle(xp: number): string {
  if (xp >= 10000) return "Diamond";
  if (xp >= 5000) return "Platinum";
  if (xp >= 3000) return "Gold";
  if (xp >= 1500) return "Silver";
  if (xp >= 500) return "Bronze";
  return "Rookie";
}
