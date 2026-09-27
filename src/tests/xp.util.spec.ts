import { computeXp, computeRankTitle } from '../utils/xp.util';

describe('XP Utility', () => {
  describe('computeXp', () => {
    it('returns 0 for 0 wins and 0 best streak', () => {
      expect(computeXp(0, 0)).toBe(0);
    });

    it('computes correctly for wins without streaks', () => {
      expect(computeXp(5, 0)).toBe(500);
    });

    it('computes correctly for wins with streaks', () => {
      expect(computeXp(5, 3)).toBe(650); // 500 + 150
    });

    it('handles large numbers without overflowing', () => {
      expect(computeXp(1000000, 10000)).toBe(100500000);
    });
  });

  describe('computeRankTitle', () => {
    it('returns Rookie for 0 XP', () => {
      expect(computeRankTitle(0)).toBe('Rookie');
    });

    it('returns Rookie for XP below 500', () => {
      expect(computeRankTitle(499)).toBe('Rookie');
    });

    it('returns Bronze for exactly 500 XP', () => {
      expect(computeRankTitle(500)).toBe('Bronze');
    });

    it('returns Bronze for XP between 500 and 1499', () => {
      expect(computeRankTitle(1499)).toBe('Bronze');
    });

    it('returns Silver for exactly 1500 XP', () => {
      expect(computeRankTitle(1500)).toBe('Silver');
    });

    it('returns Silver for XP between 1500 and 2999', () => {
      expect(computeRankTitle(2999)).toBe('Silver');
    });

    it('returns Gold for exactly 3000 XP', () => {
      expect(computeRankTitle(3000)).toBe('Gold');
    });

    it('returns Gold for XP between 3000 and 4999', () => {
      expect(computeRankTitle(4999)).toBe('Gold');
    });

    it('returns Platinum for exactly 5000 XP', () => {
      expect(computeRankTitle(5000)).toBe('Platinum');
    });

    it('returns Platinum for XP between 5000 and 9999', () => {
      expect(computeRankTitle(9999)).toBe('Platinum');
    });

    it('returns Diamond for exactly 10000 XP', () => {
      expect(computeRankTitle(10000)).toBe('Diamond');
    });

    it('returns Diamond for XP well above 10000', () => {
      expect(computeRankTitle(500000)).toBe('Diamond');
    });
  });
});
