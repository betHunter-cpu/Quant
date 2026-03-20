import { TeamMetrics, SimulationResult } from '../types/forecasting';

export class MLBEngine {
  static runMonteCarlo(
    home: TeamMetrics, 
    away: TeamMetrics, 
    iterations: number = 10000,
    bookmakerLines?: { spread?: number; total?: number }
  ): SimulationResult {
    // MLB specific logic: runs scored, pitcher influence (simplified)
    let homeWins = 0;
    let awayWins = 0;
    let totalHomeScore = 0;
    let totalAwayScore = 0;
    
    let homeCovers = 0;
    let awayCovers = 0;
    let overs = 0;
    let unders = 0;
    
    const sims = [];

    // Map basketball metrics to baseball concepts
    const homeRunsPerGame = home.offensiveRating / 10; // Simplified
    const awayRunsPerGame = away.offensiveRating / 10;
    const homeRunsAllowed = home.defensiveRating / 10;
    const awayRunsAllowed = away.defensiveRating / 10;

    const baseHomeRuns = (homeRunsPerGame + awayRunsAllowed) / 2;
    const baseAwayRuns = (awayRunsPerGame + homeRunsAllowed) / 2;

    const homeAdvantage = 0.2; // MLB typical home advantage in runs

    for (let i = 0; i < iterations; i++) {
      const homeScore = Math.max(0, this.randomPoisson(baseHomeRuns + homeAdvantage));
      const awayScore = Math.max(0, this.randomPoisson(baseAwayRuns));

      let finalHomeScore = Math.round(homeScore);
      let finalAwayScore = Math.round(awayScore);
      
      if (finalHomeScore > finalAwayScore) homeWins++;
      else awayWins++;

      totalHomeScore += finalHomeScore;
      totalAwayScore += finalAwayScore;
      
      const totalScore = finalHomeScore + finalAwayScore;
      const margin = finalHomeScore - finalAwayScore;

      if (bookmakerLines?.spread !== undefined) {
        if (margin + bookmakerLines.spread > 0) homeCovers++;
        else if (margin + bookmakerLines.spread < 0) awayCovers++;
      }

      if (bookmakerLines?.total !== undefined) {
        if (totalScore > bookmakerLines.total) overs++;
        else if (totalScore < bookmakerLines.total) unders++;
      }

      if (i < 500) {
        sims.push({ id: i, homeScore: finalHomeScore, awayScore: finalAwayScore, total: totalScore, margin: margin });
      }
    }

    return {
      homeWinProb: homeWins / iterations,
      awayWinProb: awayWins / iterations,
      expectedHomeScore: totalHomeScore / iterations,
      expectedAwayScore: totalAwayScore / iterations,
      expectedSpread: (totalAwayScore - totalHomeScore) / iterations,
      expectedTotal: (totalHomeScore + totalAwayScore) / iterations,
      coverProbHome: bookmakerLines?.spread !== undefined ? homeCovers / iterations : undefined,
      coverProbAway: bookmakerLines?.spread !== undefined ? awayCovers / iterations : undefined,
      overProb: bookmakerLines?.total !== undefined ? overs / iterations : undefined,
      underProb: bookmakerLines?.total !== undefined ? unders / iterations : undefined,
      simulations: sims.sort((a, b) => a.total - b.total)
    };
  }

  private static randomPoisson(lambda: number): number {
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  }
}
