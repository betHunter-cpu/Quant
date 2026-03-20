import { useState, useEffect } from 'react';
import { MatchData, BasketballService, BettingOdds } from '../services/basketballService';
import { ForecastingEngine, SimulationResult, TeamMetrics } from '../services/forecastingEngine';

export function useMatchAnalysis(match: MatchData | null) {
  const [simulating, setSimulating] = useState(false);
  const [homeMetrics, setHomeMetrics] = useState<TeamMetrics | null>(null);
  const [awayMetrics, setAwayMetrics] = useState<TeamMetrics | null>(null);
  const [forecast, setForecast] = useState<SimulationResult | null>(null);
  const [forecastMatchId, setForecastMatchId] = useState<number | null>(null);
  const [odds, setOdds] = useState<BettingOdds | null>(null);
  const [statistics, setStatistics] = useState<any | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!match) return;

    async function loadAnalysis() {
      // If we already have a forecast for THIS match, and the game is not 'Scheduled', don't re-run.
      if (forecast && forecastMatchId === match.id && match.status !== 'Scheduled') return;

      setSimulating(true);
      setForecast(null);
      setForecastMatchId(null);
      setOdds(null);
      setStatistics(null);
      setApiError(null);
      
      try {
        const homeStats = await BasketballService.getAdvancedMetrics(match.homeTeam.id, match.homeTeam.name, match.tournamentId, match.seasonId);
        const awayStats = await BasketballService.getAdvancedMetrics(match.awayTeam.id, match.awayTeam.name, match.tournamentId, match.seasonId);
        const matchOdds = await BasketballService.getMatchOdds(match.id);
        const matchStats = await BasketballService.getMatchStatistics(match.id);
        
        if (!homeStats || !awayStats) {
          setApiError(`No hay suficientes datos estadísticos disponibles para realizar el análisis de este partido. Home: ${homeStats ? 'OK' : 'FAIL'}, Away: ${awayStats ? 'OK' : 'FAIL'}`);
          setSimulating(false);
          return;
        }

        setHomeMetrics(homeStats);
        setAwayMetrics(awayStats);
        setOdds(matchOdds);
        setStatistics(matchStats);

        setTimeout(() => {
          const result = ForecastingEngine.runMonteCarlo(homeStats, awayStats, 10000, {
            spread: matchOdds?.spread?.line,
            total: matchOdds?.totals?.line
          });
          setForecast(result);
          setForecastMatchId(match.id);
          setSimulating(false);
        }, 800);
        
      } catch (error: any) {
        console.error("Failed to load metrics", error);
        setApiError(`Error al obtener estadísticas de los equipos. Detalle: ${error.message}`);
        setSimulating(false);
      }
    }
    loadAnalysis();
  }, [match]);

  return { simulating, forecast, odds, homeMetrics, awayMetrics, statistics, apiError };
}
