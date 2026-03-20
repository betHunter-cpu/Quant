export interface TeamMetrics {
  name: string;
  pointsScoredPerGame: number;
  pointsAllowedPerGame: number;
  pace: number;
  offensiveRating: number;
  defensiveRating: number;
  variance: number; // Standard deviation of points
  eFGPercentage: number;
  turnoverPercentage: number;
  // New optional fields for intelligent forecasting
  last5GamesOffensiveRating?: number;
  homeOffensiveRating?: number;
  awayOffensiveRating?: number;
  homeDefensiveRating?: number;
  awayDefensiveRating?: number;
}

export interface SimulationResult {
  homeWinProb: number;
  awayWinProb: number;
  expectedHomeScore: number;
  expectedAwayScore: number;
  expectedSpread: number; // Home margin (negative means home favored)
  expectedTotal: number;
  coverProbHome?: number;
  coverProbAway?: number;
  overProb?: number;
  underProb?: number;
  simulations: { id: number; homeScore: number; awayScore: number; total: number; margin: number }[];
}

export class ForecastingEngine {
  /**
   * Runs a Monte Carlo simulation for a basketball matchup.
   * @param home Home team advanced metrics
   * @param away Away team advanced metrics
   * @param iterations Number of simulations to run (default 10,000)
   * @param bookmakerLines Optional real lines to calculate edge against
   * @returns SimulationResult containing probabilities and expected values
   */
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

    // Calculate expected pace (average of both teams' pace)
    const expectedPace = (home.pace + away.pace) / 2;
    
    // Calculate expected offensive efficiency for this specific matchup
    // Use home/away specific ratings if available, otherwise fallback to general
    const homeOffRtg = home.homeOffensiveRating || home.offensiveRating;
    const homeDefRtg = home.homeDefensiveRating || home.defensiveRating;
    const awayOffRtg = away.awayOffensiveRating || away.offensiveRating;
    const awayDefRtg = away.awayDefensiveRating || away.defensiveRating;

    // Incorporate recent form if available (simple weighting)
    const homeFinalOffRtg = home.last5GamesOffensiveRating ? (homeOffRtg * 0.6 + home.last5GamesOffensiveRating * 0.4) : homeOffRtg;
    const awayFinalOffRtg = away.last5GamesOffensiveRating ? (awayOffRtg * 0.6 + away.last5GamesOffensiveRating * 0.4) : awayOffRtg;

    const homeExpectedEfficiency = (homeFinalOffRtg + awayDefRtg) / 2;
    const awayExpectedEfficiency = (awayFinalOffRtg + homeDefRtg) / 2;

    // Base expected scores before variance and home court advantage
    const baseHomeScore = (homeExpectedEfficiency / 100) * expectedPace;
    const baseAwayScore = (awayExpectedEfficiency / 100) * expectedPace;

    // Standard Home Court Advantage in modern basketball is roughly 2.5 to 3.0 points
    const homeAdvantage = 2.5;

    for (let i = 0; i < iterations; i++) {
      // Use Box-Muller transform to generate normally distributed random scores
      const homeScore = Math.round(Math.max(0, this.randomNormal(baseHomeScore + homeAdvantage, home.variance)));
      const awayScore = Math.round(Math.max(0, this.randomNormal(baseAwayScore, away.variance)));

      // Handle ties (overtime simulation approximation: 50/50 split or slight home edge)
      let finalHomeScore = homeScore;
      let finalAwayScore = awayScore;
      
      if (finalHomeScore === finalAwayScore) {
        if (Math.random() > 0.48) {
          finalHomeScore += Math.floor(Math.random() * 5) + 1;
        } else {
          finalAwayScore += Math.floor(Math.random() * 5) + 1;
        }
      }

      if (finalHomeScore > finalAwayScore) homeWins++;
      else awayWins++;

      totalHomeScore += finalHomeScore;
      totalAwayScore += finalAwayScore;
      
      const totalScore = finalHomeScore + finalAwayScore;
      const margin = finalHomeScore - finalAwayScore; // Positive means home won

      // Calculate covers if spread line is provided
      // Spread is usually from home perspective (e.g., -4.5 means home must win by 5 or more)
      if (bookmakerLines?.spread !== undefined) {
        // If spread is -4.5, margin must be > 4.5. So margin + spread > 0
        if (margin + bookmakerLines.spread > 0) {
          homeCovers++;
        } else if (margin + bookmakerLines.spread < 0) {
          awayCovers++;
        }
      }

      // Calculate totals if total line is provided
      if (bookmakerLines?.total !== undefined) {
        if (totalScore > bookmakerLines.total) {
          overs++;
        } else if (totalScore < bookmakerLines.total) {
          unders++;
        }
      }

      // Store a sample of simulations for charting (e.g., first 500)
      if (i < 500) {
        sims.push({ 
          id: i, 
          homeScore: finalHomeScore, 
          awayScore: finalAwayScore,
          total: totalScore,
          margin: margin
        });
      }
    }

    return {
      homeWinProb: homeWins / iterations,
      awayWinProb: awayWins / iterations,
      expectedHomeScore: totalHomeScore / iterations,
      expectedAwayScore: totalAwayScore / iterations,
      expectedSpread: (totalAwayScore - totalHomeScore) / iterations, // e.g., -5.5 means Home wins by 5.5
      expectedTotal: (totalHomeScore + totalAwayScore) / iterations,
      coverProbHome: bookmakerLines?.spread !== undefined ? homeCovers / iterations : undefined,
      coverProbAway: bookmakerLines?.spread !== undefined ? awayCovers / iterations : undefined,
      overProb: bookmakerLines?.total !== undefined ? overs / iterations : undefined,
      underProb: bookmakerLines?.total !== undefined ? unders / iterations : undefined,
      simulations: sims.sort((a, b) => a.total - b.total)
    };
  }

  /**
   * Generates a random number from a normal distribution using the Box-Muller transform.
   */
  private static randomNormal(mean: number, stdDev: number): number {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    const num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    return num * stdDev + mean;
  }
}
