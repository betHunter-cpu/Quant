/**
 * Basketball API Endpoint Registry
 * Based on provided OpenAPI specification
 */

export const BASKETBALL_ENDPOINTS = {
  SEARCH: (term: string) => `/api/basketball/search/${term}`,
  MATCHES_BY_DATE: (day: number, month: number, year: number) => `/api/basketball/matches/${day}/${month}/${year}`,
  LIVE_MATCHES: '/api/basketball/matches/live',
  MATCH_DETAILS: (id: number) => `/api/basketball/match/${id}`,
  MATCH_STATISTICS: (id: number) => `/api/basketball/match/${id}/statistics`,
  MATCH_H2H: (customId: string) => `/api/basketball/match/${customId}/h2h`,
  MATCH_DUEL: (id: number) => `/api/basketball/match/${id}/duel`,
  MATCH_ODDS: (id: number) => `/api/basketball/match/${id}/odds`,
  MATCH_FORM: (id: number) => `/api/basketball/match/${id}/form`,
  TEAM_DETAILS: (id: number) => `/api/basketball/team/${id}`,
  TEAM_PREVIOUS_MATCHES: (id: number, page: number) => `/api/basketball/team/${id}/matches/previous/${page}`,
  TEAM_STATS_REGULAR: (teamId: number, tournamentId: number, seasonId: number) => 
    `/api/basketball/team/${teamId}/tournament/${tournamentId}/season/${seasonId}/statistics/regularSeason`,
  TEAM_STANDINGS: (tournamentId: number, seasonId: number, type: 'total' | 'home' | 'away') => 
    `/api/basketball/tournament/${tournamentId}/season/${seasonId}/standings/${type}`,
  PLAYER_STATS_OVERALL: (playerId: number, tournamentId: number, seasonId: number) => 
    `/api/basketball/player/${playerId}/tournament/${tournamentId}/season/${seasonId}/statistics/overall`,
  IMAGE_TEAM: (id: number) => `/api/basketball/team/${id}/image`,
  IMAGE_PLAYER: (id: number) => `/api/basketball/player/${id}/image`,
};
