import { describe, expect, it } from 'vitest';
import { computeHarmonyScore } from '../src/services/scoring.js';

describe('computeHarmonyScore', () => {
  it('computes weighted normalized score', () => {
    const result = computeHarmonyScore([
      { categoryWeight: 2, questionMax: 1, selectedValue: 1 },
      { categoryWeight: 1, questionMax: 1, selectedValue: 0 },
    ]);

    expect(result.normalizedScore).toBeCloseTo(66.67, 1);
    expect(result.label).toBe('Moderate Harmony');
  });
});
