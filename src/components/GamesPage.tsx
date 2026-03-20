import React, { useEffect, useState } from 'react';
import { PronosticsPage } from './PronosticsPage';
import { BasketballService, MatchData } from '../services/basketballService';
import { Activity, Gift, Bell, User, LayoutGrid, TrendingUp, BrainCircuit, BarChart3 } from 'lucide-react';

type Sport = 'NBA' | 'NCAA' | 'MLB' | 'NHL' | 'NFL' | 'Football';
type TimeFilter = 'Today' | 'Upcoming';

const sports: { id: Sport; label: string; logo: string | React.ReactNode }[] = [
  { id: 'NBA', label: 'NBA', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/03/National_Basketball_Association_logo.svg/200px-National_Basketball_Association_logo.svg.png' },
  { id: 'NCAA', label: 'NCAA', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/NCAA_Basketball_logo.svg/200px-NCAA_Basketball_logo.svg.png' },
  { id: 'MLB', label: 'MLB', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Major_League_Baseball_logo.svg/200px-Major_League_Baseball_logo.svg.png' },
  { id: 'NHL', label: 'NHL', logo: '🏒' },
  { id: 'NFL', label: 'NFL', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/National_Football_League_logo.svg/200px-National_Football_League_logo.svg.png' },
  { id: 'Football', label: 'Football', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/200px-Premier_League_Logo.svg.png' },
];

const SportLogo = ({ sport }: { sport: { id: string; label: string; logo: string | React.ReactNode } }) => {
  const [error, setError] = useState(false);

  if (typeof sport.logo !== 'string' || error) {
    return <span className="text-3xl">{sport.logo}</span>;
  }

  return (
    <img 
      src={sport.logo} 
      alt={sport.label} 
      className="w-full h-full object-contain"
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
    />
  );
};

export function GamesPage({ onNavigateProfile }: { onNavigateProfile: () => void }) {
  const [selectedSport, setSelectedSport] = useState<Sport>('NBA');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('Today');
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [liveMatches, setLiveMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);

  useEffect(() => {
    async function loadMatches() {
      setLoading(true);
      try {
        const today = new Date();
        const dateToFetch = timeFilter === 'Today' ? today : new Date(today.setDate(today.getDate() + 1));
        const data = await BasketballService.getMatchesByDate(dateToFetch.getDate(), dateToFetch.getMonth() + 1, dateToFetch.getFullYear());
        
        const filtered = (Array.isArray(data) ? data : []).filter(m => 
          m.tournamentName.toUpperCase().includes(selectedSport)
        );
        setMatches(filtered);
      } catch (error) {
        console.error("Error loading matches:", error);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, [selectedSport, timeFilter]);

  // Live matches polling
  useEffect(() => {
    if (selectedSport !== 'NBA' || timeFilter !== 'Today') return;

    async function loadLiveMatches() {
      const live = await BasketballService.getLiveMatches();
      setLiveMatches(live);
    }

    loadLiveMatches();
    const interval = setInterval(loadLiveMatches, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, [selectedSport, timeFilter]);

  if (selectedMatch) {
    return <PronosticsPage match={selectedMatch} onBack={() => setSelectedMatch(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5">
        <h1 className="text-xl font-bold text-[#ff6600]">BET HUNTER PRO</h1>
        <div className="flex items-center gap-4 text-neutral-400">
          <span className="text-sm">ES</span>
          <Gift className="w-5 h-5" />
          <Bell className="w-5 h-5" />
          <button onClick={onNavigateProfile} className="hover:text-white transition-colors">
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Sport Filters */}
      <div className="px-6 py-6 flex gap-6 overflow-x-auto">
        {sports.map(sport => (
          <button
            key={sport.id}
            onClick={() => setSelectedSport(sport.id)}
            className={`flex flex-col items-center gap-2 transition-all ${
              selectedSport === sport.id ? 'opacity-100' : 'opacity-50 hover:opacity-80'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl overflow-hidden p-2 ${
              selectedSport === sport.id ? 'bg-gradient-to-br from-[#ff6600] to-[#ff8c00] shadow-lg shadow-[#ff6600]/20' : 'bg-[#1a1f29]'
            }`}>
              <SportLogo sport={sport} />
            </div>
            <span className="text-xs font-medium">{sport.label}</span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-6 flex gap-8 border-b border-white/5 mb-6">
        <button className="pb-3 border-b-2 border-[#ff6600] text-sm font-bold">GAMES</button>
        <button className="pb-3 border-b-2 border-transparent text-sm font-medium text-neutral-500">TRACKED</button>
      </div>

      {/* Time Filters */}
      <div className="px-6 flex gap-3 mb-6">
        {(['Today', 'Upcoming'] as TimeFilter[]).map(filter => (
          <button
            key={filter}
            onClick={() => setTimeFilter(filter)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              timeFilter === filter ? 'bg-[#ff6600] text-white' : 'bg-[#1a1f29] text-neutral-400'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Games List */}
      <div className="px-6 pb-24 space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Activity className="w-8 h-8 animate-spin text-[#ff6600]" />
          </div>
        ) : matches.length > 0 ? (
          matches.map(match => {
            const liveMatch = liveMatches.find(lm => lm.id === match.id);
            return (
              <button
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className="w-full bg-[#1a1f29] rounded-2xl p-4 flex items-center justify-between hover:bg-[#252a36] transition-all border border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="text-xs font-medium text-neutral-400">
                    {new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex flex-col gap-1 text-left">
                    <div className="flex items-center gap-2">
                      <img src={match.awayTeam.logo} className="w-6 h-6" referrerPolicy="no-referrer" />
                      <span className="text-sm font-medium">{match.awayTeam.name}</span>
                      <span className="text-[10px] text-neutral-500">A</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src={match.homeTeam.logo} className="w-6 h-6" referrerPolicy="no-referrer" />
                      <span className="text-sm font-medium">{match.homeTeam.name}</span>
                      <span className="text-[10px] text-neutral-500">H</span>
                    </div>
                  </div>
                </div>
                {liveMatch ? (
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#ff6600]">
                      {liveMatch.awayScore} - {liveMatch.homeScore}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {liveMatch.timeElapsed}
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-[#ff6600] uppercase">
                    {match.status}
                  </span>
                )}
              </button>
            );
          })
        ) : (
          <div className="text-center py-20 text-neutral-500">
            <p>No hay juegos de {selectedSport} para {timeFilter}.</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-[#0b0e14] border-t border-white/5 flex justify-around p-4 text-neutral-500">
        <button className="flex flex-col items-center gap-1 text-[#ff6600]">
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[10px] font-bold">GAMES</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <TrendingUp className="w-6 h-6" />
          <span className="text-[10px] font-medium">TOP BETS</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <BrainCircuit className="w-6 h-6" />
          <span className="text-[10px] font-medium">MODELS</span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <BarChart3 className="w-6 h-6" />
          <span className="text-[10px] font-medium">TRACKER</span>
        </button>
        <button 
          onClick={onNavigateProfile}
          className="flex flex-col items-center gap-1 hover:text-white transition-colors"
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium">PROFILE</span>
        </button>
      </nav>
    </div>
  );
}
