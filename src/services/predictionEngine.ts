/**
 * Basketball Prediction Engine
 * Implements Monte Carlo simulations and advanced analytics
 */

export interface TeamStats {
  id: number;
  name: string;
  offRating: number; // Points per 100 possessions
  defRating: number; // Points allowed per 100 possessions
  pace: number;      // Possessions per 48 mins
  homeAdvantage: number; // HCA adjustment
  recentForm: number; // 0-1 multiplier based on last 5 games
}

export interface PredictionResult {
  moneyline: {
    homeWinProb: number;
    awayWinProb: number;
    fairOddsHome: number;
    fairOddsAway: number;
  };
  spread: {
    predictedMargin: number; // Home - Away
    coverProb: number;
  };
  totals: {
    predictedTotal: number;
    overProb: number;
    underProb: number;
  };
  simulations: {
    homeScores: number[];
    awayScores: number[];
  };
}

/**
 * Runs a Monte Carlo simulation for a basketball game
 */
export function simulateGame(
  home: TeamStats,
  away: TeamStats,
  iterations: number = 10000
): PredictionResult {
  const homeScores: number[] = [];
  const awayScores: number[] = [];
  
  // 1. Calculate Expected Pace
  // Modern pace is usually (HomePace + AwayPace) / 2
  const expectedPace = (home.pace + away.pace) / 2;
  
  // 2. Calculate Expected Efficiency (Points per 100 possessions)
  // Home Off vs Away Def, Away Off vs Home Def
  // Adjusted for league average (approx 110)
  const leagueAvgEff = 110;
  
  const homeExpEff = (home.offRating * away.defRating) / leagueAvgEff + home.homeAdvantage;
  const awayExpEff = (away.offRating * home.defRating) / leagueAvgEff;
  
  // 3. Run Simulations
  // Scores follow a normal distribution around the expected mean
  // Standard deviation in NBA is typically around 10-12 points
  const stdDev = 11.5;

  let homeWins = 0;
  let awayWins = 0;
  
  const homeMean = (homeExpEff * expectedPace) / 100;
  const awayMean = (awayExpEff * expectedPace) / 100;

  for (let i = 0; i < iterations; i++) {
    const hScore = boxMullerTransform(homeMean, stdDev);
    const aScore = boxMullerTransform(awayMean, stdDev);
    
    homeScores.push(hScore);
    awayScores.push(aScore);
    
    if (hScore > aScore) homeWins++;
    else awayWins++;
  }

  const homeWinProb = homeWins / iterations;
  const awayWinProb = awayWins / iterations;

  return {
    moneyline: {
      homeWinProb,
      awayWinProb,
      fairOddsHome: 1 / homeWinProb,
      fairOddsAway: 1 / awayWinProb,
    },
    spread: {
      predictedMargin: homeMean - awayMean,
      coverProb: homeWinProb, // Simplified for this example
    },
    totals: {
      predictedTotal: homeMean + awayMean,
      overProb: 0.5, // Median
      underProb: 0.5,
    },
    simulations: {
      homeScores,
      awayScores,
    }
  };
}

/**
 * Box-Muller transform to generate normally distributed random numbers
 */
function boxMullerTransform(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}
