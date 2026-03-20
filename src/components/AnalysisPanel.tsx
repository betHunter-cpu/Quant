import React from 'react';
import { MatchData, BettingOdds } from '../services/basketballService';
import { ForecastingEngine, SimulationResult, TeamMetrics } from '../services/forecastingEngine';
import { Activity, BarChart3, Target, Shield, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { cn } from '../utils/cn';

interface AnalysisPanelProps {
  selectedMatch: MatchData;
  simulating: boolean;
  forecast: SimulationResult | null;
  odds: BettingOdds | null;
  homeMetrics: TeamMetrics | null;
  awayMetrics: TeamMetrics | null;
  statistics: any | null;
  calculateImpliedProb: (odd: number) => number;
  calculateEdge: (prob: number, odd: number) => number;
}

function decimalToAmerican(decimal: number): string {
  if (decimal >= 2.0) {
    return `+${Math.round((decimal - 1) * 100)}`;
  } else {
    return `${Math.round(-100 / (decimal - 1))}`;
  }
}

export function AnalysisPanel({ selectedMatch, simulating, forecast, odds, homeMetrics, awayMetrics, statistics, calculateImpliedProb, calculateEdge }: AnalysisPanelProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Logos and Names */}
      <div className="bg-[#1f1f1f] border border-white/5 rounded-2xl p-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-center gap-3 w-1/3">
            <img src={selectedMatch.awayTeam.logo} alt={selectedMatch.awayTeam.name} className="w-16 h-16 object-contain drop-shadow-lg" referrerPolicy="no-referrer" />
            <span className="text-xs font-mono text-center text-neutral-400 uppercase">{selectedMatch.awayTeam.name}</span>
          </div>
          <div className="text-xs font-mono text-neutral-600 font-bold tracking-widest">VS</div>
          <div className="flex flex-col items-center gap-3 w-1/3">
            <img src={selectedMatch.homeTeam.logo} alt={selectedMatch.homeTeam.name} className="w-16 h-16 object-contain drop-shadow-lg" referrerPolicy="no-referrer" />
            <span className="text-xs font-mono text-center text-neutral-400 uppercase">{selectedMatch.homeTeam.name}</span>
          </div>
        </div>
      </div>

      {/* 2, 3, 4. Moneyline, Spread, Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Moneyline */}
        <div className="bg-[#1f1f1f] border border-white/5 rounded-2xl p-3 flex flex-col justify-between">
          <h3 className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-widest mb-1">Moneyline</h3>
          {simulating ? <Skeleton /> : forecast ? (() => {
            const homeWinProb = forecast.homeWinProb * 100;
            const awayWinProb = forecast.awayWinProb * 100;
            const isHomeFavored = homeWinProb > awayWinProb;
            const forecastTeam = isHomeFavored ? selectedMatch.homeTeam.name : selectedMatch.awayTeam.name;
            const forecastProb = isHomeFavored ? homeWinProb : awayWinProb;
            const hasOdds = !!odds?.moneyline;
            const forecastOdd = hasOdds ? (isHomeFavored ? odds.moneyline.home : odds.moneyline.away) : null;
            const forecastEdge = hasOdds ? calculateEdge(forecastProb, forecastOdd!) : null;
            return (
              <div className="flex flex-col h-full justify-between">
                <div className={cn("p-2 rounded-lg border mb-2", forecastEdge! > 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-black/50 border-white/5")}>
                  <p className="text-lg font-light text-white mb-0">{forecastTeam}</p>
                  <p className="text-[9px] text-neutral-400 uppercase tracking-widest">Pronóstico de Victoria</p>
                  {forecastEdge! > 0 && <span className="text-[8px] text-emerald-400 uppercase font-bold">PICK</span>}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center bg-black/50 p-1.5 rounded-lg border border-white/5">
                    <span className="text-[9px] text-neutral-400 uppercase">Win %</span>
                    <span className="font-mono text-white text-xs">{forecastProb.toFixed(1)}%</span>
                  </div>
                  {hasOdds ? (
                    <>
                      <div className="flex justify-between items-center bg-black/50 p-1.5 rounded-lg border border-white/5">
                        <span className="text-[9px] text-neutral-400 uppercase">Odd</span>
                        <div className="text-right">
                          <span className="font-mono text-white text-xs">{decimalToAmerican(forecastOdd!)}</span>
                          <span className="text-[8px] font-mono text-neutral-500 ml-1">({calculateImpliedProb(forecastOdd!).toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center bg-black/50 p-1.5 rounded-lg border border-white/5">
                        <span className="text-[9px] text-neutral-400 uppercase">Edge</span>
                        <span className={cn("font-mono text-xs", forecastEdge! > 0 ? "text-emerald-400" : "text-neutral-500")}>
                          {forecastEdge! > 0 ? '+' : ''}{forecastEdge!.toFixed(1)}%
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center bg-black/50 p-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] text-neutral-500 uppercase">Sin Cuotas</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })() : <div className="flex flex-col items-center justify-center h-full text-neutral-500 py-2"><span className="text-[10px]">Datos no disponibles</span></div>}
        </div>

        {/* Spread */}
        <div className="bg-[#1f1f1f] border border-white/5 rounded-2xl p-3 flex flex-col justify-between">
          <h3 className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-widest mb-1">Spread</h3>
          {simulating ? <Skeleton /> : forecast ? (() => {
            const hasOdds = !!odds?.spread && forecast.coverProbHome !== undefined && forecast.coverProbAway !== undefined;
            const bookmakerLine = odds?.spread?.line || 0;
            
            const homeCoverProb = forecast.coverProbHome! * 100;
            const awayCoverProb = forecast.coverProbAway! * 100;
            const isHomeCoverFavored = homeCoverProb > awayCoverProb;
            const pickIsHome = isHomeCoverFavored; 
            
            return (
              <div className="flex flex-col h-full justify-between">
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-[10px] font-medium text-white">Pronóstico</p>
                    <p className="text-sm font-light text-white">
                      {selectedMatch.awayTeam.name} {Math.round(forecast.expectedAwayScore)} - {selectedMatch.homeTeam.name} {Math.round(forecast.expectedHomeScore)}
                    </p>
                  </div>
                  <p className="text-[9px] text-neutral-400 uppercase tracking-widest">Score Proyectado</p>
                </div>
                <div className="space-y-1">
                  {hasOdds ? (
                    <>
                      <div className="flex justify-between items-center bg-black/50 p-1.5 rounded-lg border border-white/5">
                        <span className="text-[9px] text-neutral-400 uppercase">Línea (Odd)</span>
                        <span className="font-mono text-white text-xs">({decimalToAmerican(odds!.spread!.home)})</span>
                      </div>
                      
                      <div className={cn("flex justify-between items-center p-1.5 rounded-lg border", !pickIsHome ? "bg-emerald-500/10 border-emerald-500/20" : "bg-black/50 border-white/5")}>
                        <span className="font-mono text-white text-xs">{selectedMatch.awayTeam.name} {bookmakerLine > 0 ? '' : '+'}{-bookmakerLine}</span>
                        {!pickIsHome && <span className="text-[8px] text-emerald-400 uppercase font-bold">PICK</span>}
                      </div>

                      <div className={cn("flex justify-between items-center p-1.5 rounded-lg border", pickIsHome ? "bg-emerald-500/10 border-emerald-500/20" : "bg-black/50 border-white/5")}>
                        <span className="font-mono text-white text-xs">{selectedMatch.homeTeam.name} {bookmakerLine > 0 ? '+' : ''}{bookmakerLine}</span>
                        {pickIsHome && <span className="text-[8px] text-emerald-400 uppercase font-bold">PICK</span>}
                      </div>
                    </>
                  ) : <div className="flex justify-between items-center bg-black/50 p-1.5 rounded-lg border border-white/5"><span className="text-[9px] text-neutral-500 uppercase">Sin Cuotas</span></div>}
                </div>
              </div>
            );
          })() : <div className="flex flex-col items-center justify-center h-full text-neutral-500 py-2"><span className="text-[10px]">Datos no disponibles</span></div>}
        </div>

        {/* Totals + Expected Score */}
        <div className="bg-[#1f1f1f] border border-white/5 rounded-2xl p-3 flex flex-col justify-between">
          <h3 className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-widest mb-1">Totals</h3>
          {simulating ? <Skeleton /> : forecast ? (() => {
            const projectedTotal = forecast.expectedTotal;
            const hasOdds = !!odds?.totals && forecast.overProb !== undefined && forecast.underProb !== undefined;
            return (
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-end mb-0.5">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase">Puntaje Esperado</span>
                  </div>
                  <div className="flex justify-between items-center bg-black/50 rounded-lg p-2 border border-white/5 mb-2">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] text-neutral-400 uppercase">Visitante</span>
                      <span className="text-md font-light">{Math.round(forecast.expectedAwayScore)}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-600">-</span>
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] text-neutral-400 uppercase">Local</span>
                      <span className="text-md font-light text-white">{Math.round(forecast.expectedHomeScore)}</span>
                    </div>
                  </div>
                  <p className="text-lg font-light text-white mb-0">
                    <span className="text-emerald-500">{projectedTotal.toFixed(1)}</span> pts
                  </p>
                  <p className="text-[9px] text-neutral-400 uppercase tracking-widest mb-2">Total Proyectado</p>
                </div>
                <div className="space-y-1">
                  {hasOdds ? (() => {
                    const overProb = forecast.overProb! * 100;
                    const underProb = forecast.underProb! * 100;
                    const overEdge = calculateEdge(overProb, odds.totals!.over);
                    const underEdge = calculateEdge(underProb, odds.totals!.under);
                    const isOverFavored = overProb > underProb;
                    const forecastType = isOverFavored ? 'OVER' : 'UNDER';
                    const forecastProb = isOverFavored ? overProb : underProb;
                    const forecastOdd = isOverFavored ? odds.totals!.over : odds.totals!.under;
                    const forecastEdge = isOverFavored ? overEdge : underEdge;
                    return (
                      <>
                        <div className={cn("flex justify-between items-center p-1.5 rounded-lg border", forecastEdge > 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-black/50 border-white/5")}>
                          <span className="text-[9px] text-neutral-400 uppercase">Línea (Odd)</span>
                          <div className="text-right"><span className="font-mono text-white text-xs">{forecastType} {odds.totals!.line} ({decimalToAmerican(forecastOdd)})</span></div>
                        </div>
                        <div className="flex justify-between items-center bg-black/50 p-1.5 rounded-lg border border-white/5">
                          <span className="text-[9px] text-neutral-400 uppercase">Win %</span>
                          <span className="font-mono text-white text-xs">{forecastProb.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center bg-black/50 p-1.5 rounded-lg border border-white/5">
                          <span className="text-[9px] text-neutral-400 uppercase">Edge</span>
                          <span className={cn("font-mono text-xs", forecastEdge > 0 ? "text-emerald-400" : "text-neutral-500")}>
                            {forecastEdge > 0 ? '+' : ''}{forecastEdge.toFixed(1)}%
                          </span>
                        </div>
                      </>
                    );
                  })() : <div className="flex justify-between items-center bg-black/50 p-1.5 rounded-lg border border-white/5"><span className="text-[9px] text-neutral-500 uppercase">Sin Cuotas</span></div>}
                </div>
              </div>
            );
          })() : <div className="flex flex-col items-center justify-center h-full text-neutral-500 py-2"><span className="text-[10px]">Datos no disponibles</span></div>}
        </div>
      </div>

      {/* 5. Monte Carlo */}
      <div className="bg-[#141414] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest">Distribución Monte Carlo (Totales)</h3>
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono"><AlertCircle className="w-3 h-3" /> N=10,000</div>
        </div>
        <div className="h-64 w-full">
          {forecast ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast.simulations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="total" type="number" domain={['dataMin - 10', 'dataMax + 10']} tick={{ fill: '#525252', fontSize: 12, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' }} itemStyle={{ color: '#10b981' }} labelStyle={{ color: '#888' }} formatter={(value: number) => [value, 'Puntos Totales']} labelFormatter={(label) => `Simulación: ${label} pts`} />
                <Area type="monotone" dataKey="total" stroke="#10b981" fillOpacity={1} fill="url(#colorTotal)" />
                <ReferenceLine x={forecast.expectedTotal} stroke="#fff" strokeDasharray="3 3" />
                {odds?.totals?.line && <ReferenceLine x={odds.totals.line} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Línea', fill: '#ef4444', fontSize: 10, fontFamily: 'monospace' }} />}
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="w-full h-full flex items-center justify-center border border-dashed border-white/5 rounded-lg"><span className="text-xs font-mono text-neutral-600">Esperando datos de simulación...</span></div>}
        </div>
      </div>

      {/* 6. Advanced Metrics */}
      {homeMetrics && awayMetrics && (
        <div className="bg-[#141414] border border-white/5 rounded-2xl p-3">
          <h3 className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1 flex items-center gap-2">
            <BarChart3 className="w-3 h-3" /> Métricas Avanzadas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <MetricRow label="Offensive Rtg" away={awayMetrics.offensiveRating} home={homeMetrics.offensiveRating} icon={<Target className="w-3 h-3" />} higherIsBetter />
            <MetricRow label="Defensive Rtg" away={awayMetrics.defensiveRating} home={homeMetrics.defensiveRating} icon={<Shield className="w-3 h-3" />} higherIsBetter={false} />
            <MetricRow label="Pace (Ritmo)" away={awayMetrics.pace} home={homeMetrics.pace} icon={<Zap className="w-3 h-3" />} higherIsBetter={true} />
            <MetricRow label="eFG%" away={awayMetrics.eFGPercentage} home={homeMetrics.eFGPercentage} icon={<TrendingUp className="w-3 h-3" />} higherIsBetter />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, away, home, icon, higherIsBetter }: { label: string, away: number, home: number, icon: React.ReactNode, higherIsBetter: boolean }) {
  const awayBetter = higherIsBetter ? away > home : away < home;
  const homeBetter = higherIsBetter ? home > away : home < away;
  return (
    <div>
      <div className="flex justify-between text-[9px] font-mono text-neutral-500 mb-0.5">
        <span className="flex items-center gap-1">{icon} {label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-mono", awayBetter ? "text-white" : "text-neutral-500")}>{away.toFixed(1)}</span>
        <div className="flex-1 mx-2 h-px bg-white/5 relative">
          <div className={cn("absolute top-1/2 -translate-y-1/2 h-1 w-1 rounded-full", awayBetter ? "bg-white left-0" : homeBetter ? "bg-emerald-500 right-0" : "bg-neutral-600 left-1/2")} />
        </div>
        <span className={cn("text-xs font-mono", homeBetter ? "text-emerald-400" : "text-neutral-500")}>{home.toFixed(1)}</span>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-3 animate-pulse">
      <div className="w-16 h-8 bg-white/5 rounded"></div>
      <div className="w-24 h-3 bg-white/5 rounded"></div>
    </div>
  );
}
