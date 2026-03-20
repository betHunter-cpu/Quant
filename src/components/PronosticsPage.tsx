import React from 'react';
import { MatchData } from '../services/basketballService';
import { AnalysisPanel } from './AnalysisPanel';
import { useMatchAnalysis } from '../hooks/useMatchAnalysis';
import { Activity, ServerCrash } from 'lucide-react';

export function PronosticsPage({ match, onBack, sport = 'BASKETBALL' }: { match: MatchData, onBack: () => void, sport?: 'BASKETBALL' | 'ICE_HOCKEY' }) {
  const { simulating, forecast, odds, homeMetrics, awayMetrics, statistics, apiError } = useMatchAnalysis(match, sport);

  const calculateImpliedProb = (decimalOdd: number) => {
    if (!decimalOdd || decimalOdd <= 0) return 0;
    return (1 / decimalOdd) * 100;
  };

  const calculateEdge = (ourProb: number, odd: number) => {
    const implied = calculateImpliedProb(odd);
    return ourProb - implied;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <button 
        onClick={onBack}
        className="mb-6 text-neutral-400 hover:text-white font-mono text-sm"
      >
        ← Volver a Games
      </button>

      {apiError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 mb-6">
          <ServerCrash className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{apiError}</p>
        </div>
      )}

      {!apiError && (
        <AnalysisPanel 
          selectedMatch={match}
          simulating={simulating}
          forecast={forecast}
          odds={odds}
          homeMetrics={homeMetrics}
          awayMetrics={awayMetrics}
          statistics={statistics}
          calculateImpliedProb={calculateImpliedProb}
          calculateEdge={calculateEdge}
          sport={sport}
        />
      )}
    </div>
  );
}
