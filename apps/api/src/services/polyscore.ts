import { prisma } from "@probable/db";

export class PolyScoreService {
  /**
   * Brier Score model: BS = (1/N) * sum( (probability_placed - outcome_value)^2 )
   * A Brier score of 0 is perfect, 1 is worst. PolyScore maps that to a 0–100 range.
   */
  static calculatePolyScore(history: { forecastPrice: number; resolvedOutcome: 1 | 0 }[]) {
    if (history.length === 0) return null;

    let sumSquaredError = 0;
    for (const trade of history) {
      const error = trade.forecastPrice - trade.resolvedOutcome;
      sumSquaredError += error * error;
    }

    const brierScore = sumSquaredError / history.length;
    return Math.round((1 - brierScore) * 100 * 10) / 10;
  }

  // Scores only real, resolved trades. Nothing resolves markets yet (no
  // resolver is built), so this will honestly report "no data" until it does
  // — it never falls back to a fabricated number.
  static async getUserScore(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId, market: { status: "RESOLVED", outcome: { not: null } } },
      include: { market: true },
    });

    const history = orders.map((o) => ({
      forecastPrice: o.price,
      resolvedOutcome: (o.type === "YES") === o.market.outcome ? (1 as const) : (0 as const),
    }));

    const polyScore = this.calculatePolyScore(history);
    return {
      userId,
      polyScore,
      tradesEvaluated: history.length,
      grade: polyScore == null ? null : polyScore >= 80 ? "EXPERT" : polyScore >= 60 ? "ADVANCED" : "INTERMEDIATE",
      rank: null,
      message: history.length === 0
        ? "No resolved trades yet — PolyScore needs at least one settled position to compute."
        : undefined,
    };
  }
}
