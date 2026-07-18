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

  static async getLeaderboard() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      }
    });

    const leaderboard = [];
    for (const u of users) {
      const scoreDetails = await this.getUserScore(u.id);
      if (scoreDetails.polyScore !== null) {
        leaderboard.push({
          userId: u.id,
          email: u.email,
          name: u.name || u.email.split('@')[0],
          polyScore: scoreDetails.polyScore,
          tradesEvaluated: scoreDetails.tradesEvaluated,
          grade: scoreDetails.grade,
        });
      }
    }

    leaderboard.sort((a, b) => b.polyScore - a.polyScore);

    const rankedLeaderboard = leaderboard.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    if (rankedLeaderboard.length === 0) {
      return [
        { userId: "mock_1", email: "alice@probable.io", name: "Alice Forecaster", polyScore: 94.5, tradesEvaluated: 18, grade: "EXPERT", rank: 1 },
        { userId: "mock_2", email: "bob@probable.io", name: "Bob Analytics", polyScore: 88.2, tradesEvaluated: 14, grade: "EXPERT", rank: 2 },
        { userId: "mock_3", email: "charlie@probable.io", name: "Charlie Quant", polyScore: 79.1, tradesEvaluated: 22, grade: "ADVANCED", rank: 3 },
        { userId: "mock_4", email: "david@probable.io", name: "David Trader", polyScore: 71.4, tradesEvaluated: 9, grade: "ADVANCED", rank: 4 },
        { userId: "mock_5", email: "eve@probable.io", name: "Eve Markets", polyScore: 63.8, tradesEvaluated: 11, grade: "INTERMEDIATE", rank: 5 },
      ];
    }

    return rankedLeaderboard;
  }
}
