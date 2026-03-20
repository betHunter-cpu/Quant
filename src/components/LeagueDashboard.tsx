import React, { useState } from 'react';
import { MatchData, BasketballService, BettingOdds } from '../services/basketballService';
import { NBABasketballEngine } from '../services/nbaEngine';
import { NCAABasketballEngine } from '../services/ncaaEngine';
import { SimulationResult, TeamMetrics } from '../types/forecasting';
import { Activity, ServerCrash } from 'lucide-react';
import { cn } from '../utils/cn';
import { AnalysisPanel } from './AnalysisPanel';

export function LeagueDashboard({ title, matches }: { title: string, matches: MatchData[] }) {
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(matches[0] || null);
  const [simulating, setSimulating] = useState(false);
  const [homeMetrics, setHomeMetrics] = useState<TeamMetrics | null>(null);
  const [awayMetrics, setAwayMetrics] = useState<TeamMetrics | null>(null);
  const [forecast, setForecast] = useState<SimulationResult | null>(null);
  const [odds, setOdds] = useState<BettingOdds | null>(null);
  const [statistics, setStatistics] = useState<any | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const leagueLogos: Record<string, string> = {
    'NBA': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/03/National_Basketball_Association_logo.svg/1200px-National_Basketball_Association_logo.svg.png',
    'NCAA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/NCAA_logo.svg/1200px-NCAA_logo.svg.png'
  };

  const handleSelectMatch = async (match: MatchData) => {
    setSelectedMatch(match);
    setSimulating(true);
    setForecast(null);
    setOdds(null);
    setStatistics(null);
    setApiError(null);
    
    try {
      const homeStats = await BasketballService.getAdvancedMetrics(match.homeTeam.id, match.homeTeam.name, match.tournamentId, match.seasonId);
      const awayStats = await BasketballService.getAdvancedMetrics(match.awayTeam.id, match.awayTeam.name, match.tournamentId, match.seasonId);
      const matchOdds = await BasketballService.getMatchOdds(match.id);
      const matchStats = await BasketballService.getMatchStatistics(match.id);
      
      if (!homeStats || !awayStats) {
        setApiError("No hay suficientes datos estadísticos disponibles para realizar el análisis de este partido.");
        setSimulating(false);
        return;
      }

      setHomeMetrics(homeStats);
      setAwayMetrics(awayStats);
      setOdds(matchOdds);
      setStatistics(matchStats);

      setTimeout(() => {
        const Engine = selectedMatch.tournamentName?.toLowerCase().includes('ncaa') ? NCAABasketballEngine : NBABasketballEngine;
        const result = Engine.runMonteCarlo(homeStats, awayStats, 10000, {
          spread: matchOdds?.spread?.line,
          total: matchOdds?.totals?.line
        });
        setForecast(result);
        setSimulating(false);
      }, 800);
      
    } catch (error: any) {
      console.error("Failed to load metrics", error);
      setApiError(`Error al obtener estadísticas de los equipos. Detalle: ${error.message}`);
      setSimulating(false);
    }
  };

  const calculateImpliedProb = (decimalOdd: number) => {
    if (!decimalOdd || decimalOdd <= 0) return 0;
    return (1 / decimalOdd) * 100;
  };

  const calculateEdge = (ourProb: number, odd: number) => {
    const implied = calculateImpliedProb(odd);
    return ourProb - implied;
  };

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        {leagueLogos[title] && (
          <img src={leagueLogos[title]} alt={title} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
        )}
        <h2 className="text-xl font-mono font-bold text-white uppercase tracking-widest">{title}</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {matches.map(m => (
          <button
            key={m.id}
            onClick={() => handleSelectMatch(m)}
            className={cn(
              "px-4 py-2 rounded text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap",
              selectedMatch?.id === m.id 
                ? "bg-emerald-500 text-black font-bold" 
                : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
            )}
          >
            {m.awayTeam.name.split(' ').pop()} @ {m.homeTeam.name.split(' ').pop()}
          </button>
        ))}
      </div>
      
      {apiError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 mb-6">
          <ServerCrash className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{apiError}</p>
        </div>
      )}
      
      {selectedMatch && !apiError && (
        <AnalysisPanel 
          selectedMatch={selectedMatch}
          simulating={simulating}
          forecast={forecast}
          odds={odds}
          homeMetrics={homeMetrics}
          awayMetrics={awayMetrics}
          statistics={statistics}
          calculateImpliedProb={calculateImpliedProb}
          calculateEdge={calculateEdge}
        />
      )}
    </div>
  );
}
