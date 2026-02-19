export type ScoreInput = Array<{ categoryWeight: number; questionMax: number; selectedValue: number }>;

export function computeHarmonyScore(input: ScoreInput) {
  const weightedTotal = input.reduce((acc, item) => acc + item.selectedValue * item.categoryWeight, 0);
  const weightedMax = input.reduce((acc, item) => acc + item.questionMax * item.categoryWeight, 0);
  const normalizedScore = weightedMax === 0 ? 0 : Math.max(0, (weightedTotal / weightedMax) * 100);
  const label = normalizedScore >= 75 ? 'High Harmony' : normalizedScore >= 45 ? 'Moderate Harmony' : 'Growth Opportunity';

  return {
    totalScore: weightedTotal,
    normalizedScore: Number(normalizedScore.toFixed(2)),
    label,
  };
}
