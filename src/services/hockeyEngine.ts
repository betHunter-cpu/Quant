import { TeamMetrics, SimulationResult } from '../types/forecasting';

export class HockeyEngine {
  static runMonteCarlo(
    home: TeamMetrics, 
    away: TeamMetrics, 
    iterations: number = 10000,
    bookmakerLines?: { spread?: number; total?: number }
  ): SimulationResult {
    let homeWins = 0;
    let awayWins = 0;
    let totalHomeScore = 0;
    let totalAwayScore = 0;
    
    let homeCovers = 0;
    let awayCovers = 0;
    let overs = 0;
    let unders = 0;
    
    const sims = [];

    const expectedPace = (home.pace + away.pace) / 2;
    
    const homeExpectedEfficiency = (home.offensiveRating + away.defensiveRating) / 2;
    const awayExpectedEfficiency = (away.offensiveRating + home.defensiveRating) / 2;

    const baseHomeScore = (homeExpectedEfficiency / 100) * expectedPace;
    const baseAwayScore = (awayExpectedEfficiency / 100) * expectedPace;

    const homeAdvantage = 0.35;

    for (let i = 0; i < iterations; i++) {
      const homeScore = Math.max(0, this.randomNormal(baseHomeScore + homeAdvantage, home.variance));
      const awayScore = Math.max(0, this.randomNormal(baseAwayScore, away.variance));

      let finalHomeScore = Math.round(homeScore);
      let finalAwayScore = Math.round(awayScore);
      
      // Hockey doesn't tie
      if (finalHomeScore === finalAwayScore) {
        if (Math.random() > 0.45) finalHomeScore += 1;
        else finalAwayScore += 1;
      }

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

  private static randomNormal(mean: number, stdDev: number): number {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    const num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    return num * stdDev + mean;
  }
}
