export class PolyScoreService {
  /**
   * Calculates PolyScore based on Brier Score model:
   * BS = (1/N) * sum( (probability_placed - outcome_value)^2 )
   * A Brier score of 0 is perfect, 1 is worst.
   * PolyScore maps Brier score to 0 - 100 range.
   */
  static calculatePolyScore(history: { forecastPrice: number; resolvedOutcome: 1 | 0 }[]) {
    if (history.length === 0) return 50.0; // default baseline

    let sumSquaredError = 0;
    for (const trade of history) {
      const error = trade.forecastPrice - trade.resolvedOutcome;
      sumSquaredError += error * error;
    }

    const brierScore = sumSquaredError / history.length;
    // Map: perfect Brier Score (0) -> 100, worst (1) -> 0
    const score = Math.round((1 - brierScore) * 100 * 10) / 10;
    return score;
  }

  static getUserScore(userId: string) {
    // Generate simulated trade history for calculation
    const mockHistory = [
      { forecastPrice: 0.60, resolvedOutcome: 1 as const },
      { forecastPrice: 0.80, resolvedOutcome: 1 as const },
      { forecastPrice: 0.40, resolvedOutcome: 0 as const },
      { forecastPrice: 0.75, resolvedOutcome: 0 as const }
    ];

    const polyScore = this.calculatePolyScore(mockHistory);
    return {
      userId,
      polyScore,
      tradesEvaluated: mockHistory.length,
      grade: polyScore >= 80 ? "EXPERT" : polyScore >= 60 ? "ADVANCED" : "INTERMEDIATE",
      rank: "Top 12%"
    };
  }
}
