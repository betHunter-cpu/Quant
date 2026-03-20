export interface TeamMetrics {
  name: string;
  pointsScoredPerGame: number;
  pointsAllowedPerGame: number;
  pace: number;
  offensiveRating: number;
  defensiveRating: number;
  variance: number;
  eFGPercentage: number;
  turnoverPercentage: number;
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
  expectedSpread: number;
  expectedTotal: number;
  coverProbHome?: number;
  coverProbAway?: number;
  overProb?: number;
  underProb?: number;
  simulations: { id: number; homeScore: number; awayScore: number; total: number; margin: number }[];
}
