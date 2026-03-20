import { ICE_HOCKEY_ENDPOINTS } from './apiEndpoints';
import { TeamMetrics } from '../types/forecasting';

export interface HockeyTeamStats {
  goalsScored: number;
  goalsAllowed: number;
  gamesPlayed: number;
  shotsOnGoal: number;
  shotsAgainst: number;
  powerPlayGoals: number;
  powerPlayOpportunities: number;
  penaltyKillPercentage: number;
  savePercentage: number;
}

export interface MatchData {
  id: number;
  homeTeam: { id: number; name: string; logo: string };
  awayTeam: { id: number; name: string; logo: string };
  status: string;
  startTime: string;
  tournamentId?: number;
  seasonId?: number;
  tournamentName?: string;
  homeScore?: number;
  awayScore?: number;
  timeElapsed?: string;
}

export interface BettingOdds {
  moneyline?: { home: number; away: number };
  spread?: { line: number; home: number; away: number };
  totals?: { line: number; over: number; under: number };
}

export class IceHockeyService {
  private static BASE_URL = ''; 

  private static async fetchJson<T>(endpoint: string, retries = 3, delay = 1000, cacheHours = 24): Promise<T> {
    const cacheKey = `hockey_cache_${endpoint}`;
    const cachedItem = localStorage.getItem(cacheKey);
    
    if (cachedItem) {
      try {
        const parsedCache = JSON.parse(cachedItem);
        if (Date.now() < parsedCache.expiry) {
          return parsedCache.data as T;
        } else {
          localStorage.removeItem(cacheKey);
        }
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    const response = await fetch(`${this.BASE_URL}${endpoint}`);
    const text = await response.text();
    
    let result: any = {};
    if (text) {
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid JSON response from API`);
      }
    }
    
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchJson(endpoint, retries - 1, delay * 2, cacheHours);
      }
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText || result.message}`);
    }
    
    const data = result.response || result.data || result;

    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: data,
        expiry: Date.now() + (cacheHours * 60 * 60 * 1000)
      }));
    } catch (e) {
      console.warn("Failed to save to localStorage cache", e);
    }

    return data;
  }

  static async getMatchesByDate(day: number, month: number, year: number): Promise<MatchData[]> {
    try {
      const rawData: any = await this.fetchJson(ICE_HOCKEY_ENDPOINTS.MATCHES_BY_DATE(day, month, year), 3, 1000, 1);
      
      let eventsArray: any[] = [];
      if (Array.isArray(rawData)) eventsArray = rawData;
      else if (rawData && Array.isArray(rawData.events)) eventsArray = rawData.events;
      else if (rawData && Array.isArray(rawData.matches)) eventsArray = rawData.matches;

      const mappedEvents = eventsArray
        .filter((event: any) => {
          const tournamentName = event.tournament?.name || event.league?.name || '';
          return tournamentName.includes('NHL') || tournamentName.includes('KHL') || tournamentName.includes('SHL');
        })
        .map((event: any) => {
          const homeId = event.homeTeam?.id || event.home_team?.id || 0;
          const awayId = event.awayTeam?.id || event.away_team?.id || 0;
          
          return {
            id: event.id,
            homeTeam: { id: homeId, name: event.homeTeam?.name || 'Home', logo: `/api/ice-hockey/team/${homeId}/image` },
            awayTeam: { id: awayId, name: event.awayTeam?.name || 'Away', logo: `/api/ice-hockey/team/${awayId}/image` },
            status: event.status?.description || event.status?.type || 'Scheduled',
            startTime: event.startTimestamp ? new Date(event.startTimestamp * 1000).toISOString() : new Date().toISOString(),
            tournamentId: event.tournament?.uniqueTournament?.id || event.tournament?.id,
            seasonId: event.season?.id,
            tournamentName: event.tournament?.name || ''
          };
        });

      // Filter by requested date to ensure no games from other days slip in
      return mappedEvents.filter(match => {
        const matchDate = new Date(match.startTime);
        return matchDate.getDate() === day && 
               matchDate.getMonth() + 1 === month && 
               matchDate.getFullYear() === year;
      });
    } catch (error) {
      console.error("Error fetching hockey matches:", error);
      return [];
    }
  }

  static async getLiveMatches(): Promise<MatchData[]> {
    try {
      const rawData: any = await this.fetchJson(ICE_HOCKEY_ENDPOINTS.LIVE_MATCHES, 3, 1000, 0);
      
      let eventsArray: any[] = [];
      if (Array.isArray(rawData)) eventsArray = rawData;
      else if (rawData && Array.isArray(rawData.events)) eventsArray = rawData.events;

      return eventsArray
        .filter((event: any) => {
          const tournamentName = event.tournament?.name || event.league?.name || '';
          return tournamentName.includes('NHL');
        })
        .map((event: any) => {
          const homeId = event.homeTeam?.id || event.home_team?.id || 0;
          const awayId = event.awayTeam?.id || event.away_team?.id || 0;
          
          return {
            id: event.id,
            homeTeam: { id: homeId, name: event.homeTeam?.name || 'Home', logo: `/api/ice-hockey/team/${homeId}/image` },
            awayTeam: { id: awayId, name: event.awayTeam?.name || 'Away', logo: `/api/ice-hockey/team/${awayId}/image` },
            status: event.status?.description || 'Live',
            startTime: event.startTimestamp ? new Date(event.startTimestamp * 1000).toISOString() : new Date().toISOString(),
            homeScore: event.homeScore?.current,
            awayScore: event.awayScore?.current,
            timeElapsed: event.status?.description || ''
          };
        });
    } catch (error) {
      return [];
    }
  }

  static async getTeamStats(teamId: number, tournamentId: number, seasonId: number): Promise<HockeyTeamStats | null> {
    try {
      const rawData: any = await this.fetchJson(ICE_HOCKEY_ENDPOINTS.TEAM_STATS_REGULAR(teamId, tournamentId, seasonId));
      const statsObj = rawData?.statistics || rawData?.teamStatistics || rawData;
      
      const getNum = (obj: any, paths: string[]) => {
        for (const path of paths) {
          const parts = path.split('.');
          let current = obj;
          for (const part of parts) {
            if (current === undefined || current === null) break;
            current = current[part];
          }
          if (current !== undefined && current !== null && !isNaN(Number(current))) return Number(current);
        }
        return 0;
      };

      const games = getNum(statsObj, ['gamesPlayed', 'matches', 'games.played.all']);
      if (games === 0) return null;

      return {
        goalsScored: getNum(statsObj, ['goalsScored', 'goalsFor', 'goals.for.total.all']),
        goalsAllowed: getNum(statsObj, ['goalsAllowed', 'goalsAgainst', 'goals.against.total.all']),
        gamesPlayed: games,
        shotsOnGoal: getNum(statsObj, ['shotsOnGoal', 'shots']),
        shotsAgainst: getNum(statsObj, ['shotsAgainst']),
        powerPlayGoals: getNum(statsObj, ['powerPlayGoals']),
        powerPlayOpportunities: getNum(statsObj, ['powerPlayOpportunities']),
        penaltyKillPercentage: getNum(statsObj, ['penaltyKillPercentage']),
        savePercentage: getNum(statsObj, ['savePercentage'])
      };
    } catch (error) {
      return null;
    }
  }

  static async getAdvancedMetrics(teamId: number, teamName: string, tournamentId?: number, seasonId?: number): Promise<TeamMetrics | null> {
    let finalTournamentId = tournamentId;
    let finalSeasonId = seasonId;

    if (!finalTournamentId || !finalSeasonId) {
      try {
        const teamDetails: any = await this.fetchJson(ICE_HOCKEY_ENDPOINTS.TEAM_DETAILS(teamId));
        const teamData = teamDetails?.team || teamDetails;
        if (!finalTournamentId) finalTournamentId = teamData?.primaryUniqueTournament?.id || teamData?.tournament?.id;
        if (!finalSeasonId) finalSeasonId = teamData?.primaryUniqueTournament?.currentSeason?.id || teamData?.currentSeason?.id;
      } catch (e) {}
    }

    if (!finalTournamentId || !finalSeasonId) return null;

    const stats = await this.getTeamStats(teamId, finalTournamentId, finalSeasonId);
    if (!stats) return null;

    const games = stats.gamesPlayed;
    const gpg = stats.goalsScored / games;
    const gapg = stats.goalsAllowed / games;
    
    // Pace in hockey = Shots per game
    const pace = stats.shotsOnGoal > 0 ? (stats.shotsOnGoal / games) : 30; // Default 30 shots
    
    // Offensive Rating = Goals per 100 shots (Shooting %)
    // But to keep it consistent with the engine's (Efficiency / 100) * Pace formula:
    // baseScore = (Eff / 100) * Pace
    // GPG = (Eff / 100) * ShotsPG
    // Eff = (GPG / ShotsPG) * 100 = Shooting % * 100
    const offensiveRating = (gpg / pace) * 100;
    
    // Defensive Rating = Goals Allowed per 100 shots faced
    const shotsAgainstPG = stats.shotsAgainst > 0 ? (stats.shotsAgainst / games) : 30;
    const defensiveRating = (gapg / shotsAgainstPG) * 100;

    return {
      name: teamName,
      pointsScoredPerGame: gpg,
      pointsAllowedPerGame: gapg,
      pace: pace,
      offensiveRating: offensiveRating,
      defensiveRating: defensiveRating,
      variance: 1.5, // Hockey variance is much lower than basketball
      eFGPercentage: (gpg / pace) * 100, // Shooting %
      turnoverPercentage: 0 // Not used for hockey in this simple model
    };
  }

  static async getMatchOdds(matchId: number): Promise<BettingOdds | null> {
    try {
      const rawData: any = await this.fetchJson(ICE_HOCKEY_ENDPOINTS.MATCH_ODDS(matchId));
      const markets = rawData?.markets;
      if (!markets || !Array.isArray(markets)) return null;

      const parseFractional = (frac: string) => {
        if (!frac) return 0;
        const parts = frac.split('/');
        if (parts.length === 2) return (parseInt(parts[0]) / parseInt(parts[1])) + 1;
        return 0;
      };

      let moneyline, spread, totals;

      const mlMarket = markets.find(m => m.marketName === 'Full time' || m.marketGroup === 'Home/Away');
      if (mlMarket?.choices?.length >= 2) {
        moneyline = {
          home: parseFractional(mlMarket.choices.find((c: any) => c.name === '1' || c.name === 'Home')?.fractionalValue),
          away: parseFractional(mlMarket.choices.find((c: any) => c.name === '2' || c.name === 'Away')?.fractionalValue)
        };
      }

      const spreadMarket = markets.find(m => m.marketName === 'Puck line' || m.marketName === 'Handicap');
      if (spreadMarket?.choices?.length >= 2) {
        const lineMatch = spreadMarket.choices[0].name?.match(/\(([-+]?[0-9]*\.?[0-9]+)\)/);
        if (lineMatch) {
          spread = {
            line: parseFloat(lineMatch[1]),
            home: parseFractional(spreadMarket.choices[0].fractionalValue),
            away: parseFractional(spreadMarket.choices[1].fractionalValue)
          };
        }
      }

      const totalsMarket = markets.find(m => m.marketName === 'Total goals');
      if (totalsMarket?.choices?.length >= 2) {
        const line = parseFloat(totalsMarket.choiceGroup || '0');
        if (line > 0) {
          totals = {
            line,
            over: parseFractional(totalsMarket.choices.find((c: any) => c.name === 'Over')?.fractionalValue),
            under: parseFractional(totalsMarket.choices.find((c: any) => c.name === 'Under')?.fractionalValue)
          };
        }
      }

      return { moneyline, spread, totals };
    } catch (e) {
      return null;
    }
  }

  static async getMatchStatistics(matchId: number) {
    return this.fetchJson(ICE_HOCKEY_ENDPOINTS.MATCH_STATISTICS(matchId));
  }
}
