import { useState, useEffect } from 'react';
import { MatchData, BasketballService, BettingOdds } from '../services/basketballService';
import { IceHockeyService } from '../services/iceHockeyService';
import { NBABasketballEngine } from '../services/nbaEngine';
import { NCAABasketballEngine } from '../services/ncaaEngine';
import { HockeyEngine } from '../services/hockeyEngine';
import { MLBEngine } from '../services/mlbEngine';
import { SimulationResult, TeamMetrics } from '../types/forecasting';

export function useMatchAnalysis(match: MatchData | null, sport: 'BASKETBALL' | 'ICE_HOCKEY' | 'BASEBALL' = 'BASKETBALL') {
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
        const Service = sport === 'ICE_HOCKEY' ? IceHockeyService : BasketballService;
        
        let Engine;
        if (sport === 'ICE_HOCKEY') {
          Engine = HockeyEngine;
        } else if (sport === 'BASEBALL') {
          Engine = MLBEngine;
        } else {
          // Distinguish NBA and NCAA
          if (match.tournamentName?.toLowerCase().includes('ncaa')) {
            Engine = NCAABasketballEngine;
          } else {
            Engine = NBABasketballEngine;
          }
        }
        
        const homeStats = await Service.getAdvancedMetrics(match.homeTeam.id, match.homeTeam.name, match.tournamentId, match.seasonId);
        const awayStats = await Service.getAdvancedMetrics(match.awayTeam.id, match.awayTeam.name, match.tournamentId, match.seasonId);
        const matchOdds = await Service.getMatchOdds(match.id);
        const matchStats = await Service.getMatchStatistics(match.id);
        
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
          const result = Engine.runMonteCarlo(homeStats, awayStats, 10000, {
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
  }, [match, sport]);

  return { simulating, forecast, odds, homeMetrics, awayMetrics, statistics, apiError };
}
