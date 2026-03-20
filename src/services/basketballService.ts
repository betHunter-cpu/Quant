import { BASKETBALL_ENDPOINTS } from './apiEndpoints';
import { TeamMetrics } from './forecastingEngine';

export interface TeamStats {
  pointsScored: number;
  pointsAllowed: number;
  gamesPlayed: number;
  fieldGoalPercentage: number;
  threePointPercentage: number;
  rebounds: number;
  assists: number;
  turnovers: number;
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
}

export interface BettingOdds {
  moneyline?: { home: number; away: number };
  spread?: { line: number; home: number; away: number };
  totals?: { line: number; over: number; under: number };
}

export class BasketballService {
  private static BASE_URL = ''; // Use relative path to hit the Express backend

  private static async fetchJson<T>(endpoint: string, retries = 3, delay = 1000, cacheHours = 24): Promise<T> {
    // Check client-side cache first
    const cacheKey = `bball_cache_${endpoint}`;
    const cachedItem = localStorage.getItem(cacheKey);
    
    if (cachedItem) {
      try {
        const parsedCache = JSON.parse(cachedItem);
        if (Date.now() < parsedCache.expiry) {
          console.log(`[CLIENT CACHE HIT] ${endpoint}`);
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
        console.error(`Failed to parse JSON from ${endpoint}:`, text.substring(0, 200));
        throw new Error(`Invalid JSON response from API`);
      }
    }
    
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        console.warn(`Rate limit hit for ${endpoint}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchJson(endpoint, retries - 1, delay * 2, cacheHours);
      }
      if (result.error === 'MISSING_SECRETS') {
        throw new Error('MISSING_SECRETS');
      }
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText || result.message}`);
    }
    
    // Handle different API wrappers (e.g., API-Sports uses 'response', others use 'data')
    const data = result.response || result.data || result;

    // Save to client-side cache
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
      const rawData: any = await this.fetchJson(BASKETBALL_ENDPOINTS.MATCHES_BY_DATE(day, month, year), 3, 1000, 1);
      
      // Extract the array of matches/events
      let eventsArray: any[] = [];
      if (Array.isArray(rawData)) {
        eventsArray = rawData;
      } else if (rawData && Array.isArray(rawData.events)) {
        eventsArray = rawData.events;
      } else if (rawData && Array.isArray(rawData.matches)) {
        eventsArray = rawData.matches;
      } else if (rawData && typeof rawData === 'object') {
        // Fallback: try to find any array inside the object
        const firstArrayValue = Object.values(rawData).find(val => Array.isArray(val));
        if (firstArrayValue) {
          eventsArray = firstArrayValue as any[];
        }
      }

      // Map the raw data to our MatchData interface
      const mappedEvents = eventsArray
        .filter((event: any) => {
          const homeId = event.homeTeam?.id || event.home_team?.id;
          const awayId = event.awayTeam?.id || event.away_team?.id;
          const tournamentName = event.tournament?.name || event.league?.name || '';
          const isNBAorNCAA = tournamentName.includes('NBA') || tournamentName.includes('NCAA');
          return event.id && homeId && awayId && isNBAorNCAA;
        }) // Filter out events without an ID or missing team IDs, and enforce NBA/NCAA only
        .map((event: any) => {
        // Handle different possible structures for team names and IDs
        const homeId = event.homeTeam?.id || event.home_team?.id || 0;
        const awayId = event.awayTeam?.id || event.away_team?.id || 0;
        
        const homeName = event.homeTeam?.name || event.home_team?.name || 'Home Team';
        const awayName = event.awayTeam?.name || event.away_team?.name || 'Away Team';

        // Construct logo URLs using the API's image endpoints
        const homeLogo = `/api/basketball/team/${homeId}/image/small`;
        const awayLogo = `/api/basketball/team/${awayId}/image/small`;

        // Handle status
        const status = event.status?.description || event.status?.type || event.status || 'Scheduled';

        // Handle start time
        const startTime = event.startTimestamp 
          ? new Date(event.startTimestamp * 1000).toISOString() 
          : event.startTime || new Date().toISOString();

        // Extract tournament and season IDs if available
        const tournamentId = event.tournament?.uniqueTournament?.id || event.tournament?.id || event.league?.id;
        const seasonId = event.season?.id || event.league?.season;
        const tournamentName = event.tournament?.name || event.league?.name || '';

        return {
          id: event.id,
          homeTeam: { id: homeId, name: homeName, logo: homeLogo },
          awayTeam: { id: awayId, name: awayName, logo: awayLogo },
          status: status,
          startTime: startTime,
          tournamentId: tournamentId,
          seasonId: seasonId,
          tournamentName: tournamentName
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
      console.error("Error fetching matches:", error);
      throw error;
    }
  }

  static async getLiveMatches(): Promise<MatchData[]> {
    try {
      const rawData: any = await this.fetchJson(BASKETBALL_ENDPOINTS.LIVE_MATCHES, 3, 1000, 0); // 0 cache hours to force fresh data
      
      let eventsArray: any[] = [];
      if (Array.isArray(rawData)) {
        eventsArray = rawData;
      } else if (rawData && Array.isArray(rawData.events)) {
        eventsArray = rawData.events;
      } else if (rawData && Array.isArray(rawData.matches)) {
        eventsArray = rawData.matches;
      }

      return eventsArray
        .filter((event: any) => {
          const tournamentName = event.tournament?.name || event.league?.name || '';
          return tournamentName.includes('NBA') || tournamentName.includes('NCAA');
        })
        .map((event: any) => {
          const homeId = event.homeTeam?.id || event.home_team?.id || 0;
          const awayId = event.awayTeam?.id || event.away_team?.id || 0;
          
          return {
            id: event.id,
            homeTeam: { id: homeId, name: event.homeTeam?.name || event.home_team?.name || 'Home', logo: `/api/basketball/team/${homeId}/image/small` },
            awayTeam: { id: awayId, name: event.awayTeam?.name || event.away_team?.name || 'Away', logo: `/api/basketball/team/${awayId}/image/small` },
            status: event.status?.description || event.status?.type || 'Live',
            startTime: event.startTimestamp ? new Date(event.startTimestamp * 1000).toISOString() : new Date().toISOString(),
            tournamentName: event.tournament?.name || event.league?.name || '',
            // Include live score data if available
            homeScore: event.homeScore?.current || event.scores?.home,
            awayScore: event.awayScore?.current || event.scores?.away,
            timeElapsed: event.status?.description || ''
          } as any; // Cast to any to include extra fields
        });
    } catch (error) {
      console.error("Error fetching live matches:", error);
      return [];
    }
  }

  static async getTeamStats(teamId: number, tournamentId: number, seasonId: number): Promise<TeamStats> {
    try {
      console.log(`Fetching stats for team ${teamId}, tournament ${tournamentId}, season ${seasonId}`);
      const rawData: any = await this.fetchJson(BASKETBALL_ENDPOINTS.TEAM_STATS_REGULAR(teamId, tournamentId, seasonId));
      console.log(`Raw stats data for team ${teamId}:`, rawData);
      
      // Try to find the statistics object
      let statsObj = rawData;
      if (rawData && rawData.statistics) statsObj = rawData.statistics;
      else if (rawData && rawData.teamStatistics) statsObj = rawData.teamStatistics;
      
      // Helper to safely extract numbers, including nested paths like 'games.played.all'
      const getNum = (obj: any, paths: string[]) => {
        if (!obj) return 0;
        for (const path of paths) {
          const parts = path.split('.');
          let current = obj;
          for (const part of parts) {
            if (current === undefined || current === null) break;
            current = current[part];
          }
          if (current !== undefined && current !== null && !isNaN(Number(current))) {
            return Number(current);
          }
        }
        return 0;
      };

      // Map to our TeamStats interface
      const stats = {
        pointsScored: getNum(statsObj, ['pointsScored', 'points.for.total.all', 'points', 'pts']),
        pointsAllowed: getNum(statsObj, ['pointsAllowed', 'pointsConceded', 'points.against.total.all', 'pointsAgainst', 'oppPts']),
        gamesPlayed: getNum(statsObj, ['gamesPlayed', 'matches', 'games.played.all', 'games']),
        fieldGoalPercentage: getNum(statsObj, ['fieldGoalPercentage', 'fieldGoalsPercentage', 'fgPct', 'fieldGoalsPct']),
        threePointPercentage: getNum(statsObj, ['threePointPercentage', 'threePointsPercentage', 'tpPct', 'threePointsPct']),
        rebounds: getNum(statsObj, ['rebounds', 'totReb', 'trb']),
        assists: getNum(statsObj, ['assists', 'ast']),
        turnovers: getNum(statsObj, ['turnovers', 'tov'])
      };

      if (stats.gamesPlayed === 0) {
        return null;
      }

      return stats;
    } catch (error) {
      console.error(`Error fetching stats for team ${teamId}:`, error);
      throw error;
    }
  }

  static async calculateStatsFromPreviousMatches(teamId: number): Promise<TeamStats> {
    try {
      const rawData: any = await this.fetchJson(BASKETBALL_ENDPOINTS.TEAM_PREVIOUS_MATCHES(teamId, 0));
      let eventsArray: any[] = [];
      if (Array.isArray(rawData)) eventsArray = rawData;
      else if (rawData && Array.isArray(rawData.events)) eventsArray = rawData.events;
      else if (rawData && Array.isArray(rawData.matches)) eventsArray = rawData.matches;
      
      if (eventsArray.length === 0) {
        return null;
      }

      let pointsScored = 0;
      let pointsAllowed = 0;
      let gamesPlayed = 0;

      for (const event of eventsArray) {
        const status = event.status?.type || event.status?.description || event.status;
        if (status !== 'finished' && status !== 'Closed' && status !== 'FT') continue;

        const homeId = event.homeTeam?.id || event.home_team?.id;
        const awayId = event.awayTeam?.id || event.away_team?.id;
        
        const homeScore = event.homeScore?.current || event.homeScore?.display || event.scores?.home || 0;
        const awayScore = event.awayScore?.current || event.awayScore?.display || event.scores?.away || 0;

        if (homeId === teamId) {
          pointsScored += Number(homeScore);
          pointsAllowed += Number(awayScore);
          gamesPlayed++;
        } else if (awayId === teamId) {
          pointsScored += Number(awayScore);
          pointsAllowed += Number(homeScore);
          gamesPlayed++;
        }
      }

      if (gamesPlayed === 0) {
        return null;
      }

      return {
        pointsScored,
        pointsAllowed,
        gamesPlayed,
        fieldGoalPercentage: 0,
        threePointPercentage: 0,
        rebounds: 0,
        assists: 0,
        turnovers: 0
      };
    } catch (error) {
      console.error(`Error calculating stats from previous matches for team ${teamId}:`, error);
      throw error;
    }
  }

  static async getAdvancedMetrics(teamId: number, teamName: string, tournamentId?: number, seasonId?: number): Promise<TeamMetrics> {
    let finalTournamentId = tournamentId;
    let finalSeasonId = seasonId;

    console.log(`Resolving metrics for team ${teamId}, tournament ${tournamentId}, season ${seasonId}`);

    // If tournament or season is missing, fetch team details to find the current tournament and season
    if (!finalTournamentId || !finalSeasonId) {
      try {
        const teamDetails: any = await this.fetchJson(BASKETBALL_ENDPOINTS.TEAM_DETAILS(teamId));
        console.log(`Team details for ${teamId}:`, teamDetails);
        const teamData = teamDetails?.team || teamDetails;
        
        if (!finalTournamentId) {
          finalTournamentId = teamData?.primaryUniqueTournament?.id || teamData?.tournament?.id;
        }
        
        // Some APIs return the current season in the team details
        if (!finalSeasonId) {
          finalSeasonId = teamData?.primaryUniqueTournament?.currentSeason?.id || teamData?.currentSeason?.id;
        }
      } catch (e) {
        console.warn(`Could not fetch team details for ${teamId} to resolve tournament/season.`);
      }

      // If still missing, try to get it from their most recent match
      if (!finalTournamentId || !finalSeasonId) {
        try {
          const previousMatches: any = await this.fetchJson(BASKETBALL_ENDPOINTS.TEAM_PREVIOUS_MATCHES(teamId, 0));
          let eventsArray: any[] = [];
          if (Array.isArray(previousMatches)) eventsArray = previousMatches;
          else if (previousMatches && Array.isArray(previousMatches.events)) eventsArray = previousMatches.events;
          else if (previousMatches && Array.isArray(previousMatches.matches)) eventsArray = previousMatches.matches;

          if (eventsArray.length > 0) {
            const lastMatch = eventsArray[0];
            if (!finalTournamentId) {
              finalTournamentId = lastMatch.tournament?.uniqueTournament?.id || lastMatch.tournament?.id || lastMatch.league?.id;
            }
            if (!finalSeasonId) {
              finalSeasonId = lastMatch.season?.id || lastMatch.league?.season;
            }
          }
        } catch (e) {
          console.warn(`Could not fetch previous matches for ${teamId} to resolve tournament/season.`);
        }
      }
    }

    console.log(`Resolved metrics for team ${teamId}: tournamentId=${finalTournamentId}, seasonId=${finalSeasonId}`);

    // Fetch REAL data from the API
    let stats: TeamStats | null = null;
    try {
      if (finalTournamentId && finalSeasonId) {
        stats = await this.getTeamStats(teamId, finalTournamentId, finalSeasonId);
      }
      
      if (!stats) {
        console.warn(`Could not fetch regular season stats for ${teamId}. Calculating from recent matches...`);
        stats = await this.calculateStatsFromPreviousMatches(teamId);
      }
    } catch (error) {
      console.error(`Error fetching stats for ${teamId}:`, error);
      return null;
    }
    
    if (!stats) {
      return null;
    }
    
    // Fallback to 1 if gamesPlayed is 0 to avoid division by zero
    const games = stats.gamesPlayed > 0 ? stats.gamesPlayed : 1;
    
    const ppg = stats.pointsScored / games;
    const papg = stats.pointsAllowed / games;
    
    // Approximate Pace (Possessions per game). 
    // Approximation: Pace ≈ PPG / (FG% * 2) + Turnovers per game
    if (stats.fieldGoalPercentage === 0) {
      console.warn(`Insufficient field goal percentage data for team ${teamId}`);
      return null;
    }
    const fgDecimal = stats.fieldGoalPercentage / 100;
    const pace = (ppg / (fgDecimal * 2)) + (stats.turnovers / games);
    
    // Calculate Ratings (Points per 100 possessions)
    const offensiveRating = (ppg / pace) * 100;
    const defensiveRating = (papg / pace) * 100;
    
    return {
      name: teamName,
      pointsScoredPerGame: ppg,
      pointsAllowedPerGame: papg,
      pace: pace,
      offensiveRating: offensiveRating,
      defensiveRating: defensiveRating,
      variance: 13.5, // Standard NBA variance for Monte Carlo
      eFGPercentage: stats.fieldGoalPercentage + (stats.threePointPercentage * 0.5),
      turnoverPercentage: ((stats.turnovers / games) / pace) * 100
    };
  }

  static async getMatchStatistics(matchId: number): Promise<any> {
    return this.fetchJson(BASKETBALL_ENDPOINTS.MATCH_STATISTICS(matchId));
  }

  static async getMatchDuel(matchId: number) {
    return this.fetchJson(BASKETBALL_ENDPOINTS.MATCH_DUEL(matchId));
  }

  static async getMatchForm(matchId: number) {
    return this.fetchJson(BASKETBALL_ENDPOINTS.MATCH_FORM(matchId));
  }

  static async getMatchOdds(matchId: number): Promise<BettingOdds | null> {
    try {
      const rawData: any = await this.fetchJson(BASKETBALL_ENDPOINTS.MATCH_ODDS(matchId), 3, 1000, 1);
      
      let moneyline: { home: number; away: number } | undefined;
      let spread: { line: number; home: number; away: number } | undefined;
      let totals: { line: number; over: number; under: number } | undefined;

      const parseFractional = (frac: string) => {
        if (!frac) return 0;
        const parts = frac.split('/');
        if (parts.length === 2) {
          return (parseInt(parts[0]) / parseInt(parts[1])) + 1;
        }
        return 0;
      };

      const markets = rawData?.markets;
      if (markets && Array.isArray(markets)) {
        // Moneyline
        const mlMarket = markets.find(m => m.marketGroup === 'Home/Away' || m.marketName === 'Full time');
        if (mlMarket && mlMarket.choices && mlMarket.choices.length >= 2) {
          const homeChoice = mlMarket.choices.find((c: any) => c.name === '1' || c.name === 'Home');
          const awayChoice = mlMarket.choices.find((c: any) => c.name === '2' || c.name === 'Away');
          if (homeChoice && awayChoice) {
            moneyline = {
              home: parseFractional(homeChoice.fractionalValue),
              away: parseFractional(awayChoice.fractionalValue)
            };
          }
        }

        // Spread
        const spreadMarket = markets.find(m => m.marketGroup === 'Point spread' || m.marketName === 'Point spread');
        if (spreadMarket && spreadMarket.choices && spreadMarket.choices.length >= 2) {
          const choice1 = spreadMarket.choices[0];
          const choice2 = spreadMarket.choices[1];
          const lineMatch = choice1.name?.match(/\(([-+]?[0-9]*\.?[0-9]+)\)/);
          if (lineMatch) {
            spread = {
              line: parseFloat(lineMatch[1]),
              home: parseFractional(choice1.fractionalValue),
              away: parseFractional(choice2.fractionalValue)
            };
          }
        }

        // Totals
        const totalsMarket = markets.find(m => m.marketGroup === 'Over/Under' || m.marketName === 'Game total');
        if (totalsMarket && totalsMarket.choices && totalsMarket.choices.length >= 2) {
          const overChoice = totalsMarket.choices.find((c: any) => c.name === 'Over');
          const underChoice = totalsMarket.choices.find((c: any) => c.name === 'Under');
          const line = totalsMarket.choiceGroup ? parseFloat(totalsMarket.choiceGroup) : 0;
          if (overChoice && underChoice && line > 0) {
            totals = {
              line: line,
              over: parseFractional(overChoice.fractionalValue),
              under: parseFractional(underChoice.fractionalValue)
            };
          }
        }
      }

      if (!moneyline && !spread && !totals) {
        return null; // No odds found
      }

      return { moneyline, spread, totals };
    } catch (error) {
      console.error(`Error fetching odds for match ${matchId}:`, error);
      return null;
    }
  }
}
