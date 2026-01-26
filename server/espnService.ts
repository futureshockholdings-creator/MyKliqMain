/**
 * ESPN API Service
 * Fetches sports data from ESPN's public API (no authentication required)
 */

interface ESPNTeam {
  id: string;
  displayName: string;
  abbreviation: string;
  logo: string;
  color: string;
  alternateColor: string;
}

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  season: {
    year: number;
  };
  competitions: Array<{
    id: string;
    date: string;
    attendance: number;
    status: {
      type: {
        id: string;
        name: string;
        state: string;
        completed: boolean;
        description: string;
        detail: string;
        shortDetail: string;
      };
    };
    competitors: Array<{
      id: string;
      homeAway: 'home' | 'away';
      team: ESPNTeam;
      score: string;
      winner: boolean;
    }>;
    venue?: {
      fullName: string;
    };
  }>;
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  sport: string;
}

export interface GameUpdate {
  eventId: string;
  sport: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamScore: number | null;
  homeTeamLogo: string | null;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamScore: number | null;
  awayTeamLogo: string | null;
  status: 'scheduled' | 'in_progress' | 'final';
  statusDetail: string;
  eventDate: Date;
  venue: string | null;
}

export interface LeaderboardEntry {
  position: number;
  name: string;
  score?: string;
}

export interface IndividualSportUpdate {
  eventId: string;
  sport: string;
  sportName: string;
  sportIcon: string;
  eventName: string;
  eventDate: Date;
  status: 'scheduled' | 'in_progress' | 'final';
  statusDetail: string;
  venue: string | null;
  topFive: LeaderboardEntry[];
}

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

// Supported sports configurations
const SPORTS_CONFIG = {
  nfl: {
    path: 'football/nfl',
    name: 'NFL',
    icon: '🏈',
    isIndividualSport: false
  },
  cfb: {
    path: 'football/college-football',
    name: 'College Football',
    icon: '🏈',
    isIndividualSport: false
  },
  nba: {
    path: 'basketball/nba',
    name: 'NBA',
    icon: '🏀',
    isIndividualSport: false
  },
  cbb: {
    path: 'basketball/mens-college-basketball',
    name: 'College Basketball',
    icon: '🏀',
    isIndividualSport: false
  },
  mlb: {
    path: 'baseball/mlb',
    name: 'MLB',
    icon: '⚾',
    isIndividualSport: false
  },
  nhl: {
    path: 'hockey/nhl',
    name: 'NHL',
    icon: '🏒',
    isIndividualSport: false
  },
  soccer: {
    path: 'soccer/usa.1',
    name: 'MLS',
    icon: '⚽',
    isIndividualSport: false
  },
  nascar: {
    path: 'racing/nascar-premier',
    name: 'NASCAR Cup Series',
    icon: '🏎️',
    isIndividualSport: true
  },
  xfinity: {
    path: 'racing/nascar-secondary',
    name: 'NASCAR Xfinity',
    icon: '🏎️',
    isIndividualSport: true
  },
  truck: {
    path: 'racing/nascar-truck',
    name: 'NASCAR Truck Series',
    icon: '🏁',
    isIndividualSport: true
  },
  f1: {
    path: 'racing/f1',
    name: 'Formula 1',
    icon: '🏎️',
    isIndividualSport: true
  },
  indycar: {
    path: 'racing/irl',
    name: 'IndyCar',
    icon: '🏎️',
    isIndividualSport: true
  },
  nhra: {
    path: 'racing/nhra',
    name: 'NHRA Drag Racing',
    icon: '🏁',
    isIndividualSport: true
  },
  wnba: {
    path: 'basketball/wnba',
    name: 'WNBA',
    icon: '🏀',
    isIndividualSport: false
  },
  wcbb: {
    path: 'basketball/womens-college-basketball',
    name: "Women's College Basketball",
    icon: '🏀',
    isIndividualSport: false
  },
  lpga: {
    path: 'golf/lpga',
    name: 'LPGA',
    icon: '⛳',
    isIndividualSport: true
  },
  wta: {
    path: 'tennis/wta',
    name: 'WTA Tennis',
    icon: '🎾',
    isIndividualSport: true
  },
  ufc: {
    path: 'mma/ufc',
    name: 'UFC/MMA',
    icon: '🥊',
    isIndividualSport: true
  },
  boxing: {
    path: 'boxing/boxing',
    name: 'Boxing',
    icon: '🥊',
    isIndividualSport: true
  },
  premierleague: {
    path: 'soccer/eng.1',
    name: 'Premier League',
    icon: '⚽',
    isIndividualSport: false
  },
  laliga: {
    path: 'soccer/esp.1',
    name: 'La Liga',
    icon: '⚽',
    isIndividualSport: false
  },
  seriea: {
    path: 'soccer/ita.1',
    name: 'Serie A',
    icon: '⚽',
    isIndividualSport: false
  },
  bundesliga: {
    path: 'soccer/ger.1',
    name: 'Bundesliga',
    icon: '⚽',
    isIndividualSport: false
  },
  championsleague: {
    path: 'soccer/uefa.champions',
    name: 'Champions League',
    icon: '⚽',
    isIndividualSport: false
  },
  collegebb: {
    path: 'baseball/college-baseball',
    name: 'College Baseball',
    icon: '⚾',
    isIndividualSport: false
  },
  mcollegehockey: {
    path: 'hockey/mens-college-hockey',
    name: "Men's College Hockey",
    icon: '🏒',
    isIndividualSport: false
  },
  wcollegehockey: {
    path: 'hockey/womens-college-hockey',
    name: "Women's College Hockey",
    icon: '🏒',
    isIndividualSport: false
  },
  pga: {
    path: 'golf/pga',
    name: 'PGA Tour',
    icon: '⛳',
    isIndividualSport: true
  },
  atp: {
    path: 'tennis/atp',
    name: 'ATP Tennis',
    icon: '🎾',
    isIndividualSport: true
  },
  rugby: {
    path: 'rugby/rugby',
    name: 'Rugby',
    icon: '🏉',
    isIndividualSport: false
  },
  cricket: {
    path: 'cricket/cricket',
    name: 'Cricket',
    icon: '🏏',
    isIndividualSport: false
  }
} as const;

export type Sport = keyof typeof SPORTS_CONFIG;

class ESPNService {
  /**
   * Fetch all teams for a specific sport
   */
  async getTeams(sport: Sport): Promise<Team[]> {
    try {
      const sportPath = SPORTS_CONFIG[sport]?.path;
      if (!sportPath) {
        throw new Error(`Unsupported sport: ${sport}`);
      }

      // Use higher limit for college sports which have many more teams
      const isCollegeSport = sport === 'cfb' || sport === 'cbb';
      const limit = isCollegeSport ? 400 : 100;
      
      const url = `${ESPN_API_BASE}/${sportPath}/teams?limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.sports || !data.sports[0]?.leagues || !data.sports[0].leagues[0]?.teams) {
        return [];
      }

      const teams: Team[] = data.sports[0].leagues[0].teams.map((item: any) => {
        const team = item.team;
        return {
          id: team.id,
          name: team.displayName,
          abbreviation: team.abbreviation || team.shortDisplayName,
          logo: team.logos?.[0]?.href || '',
          sport
        };
      });

      return teams;
    } catch (error) {
      console.error(`Error fetching ${sport} teams:`, error);
      return [];
    }
  }

  /**
   * Fetch recent and upcoming games (scoreboard)
   */
  async getScoreboard(sport: Sport, date?: Date): Promise<GameUpdate[]> {
    try {
      const sportPath = SPORTS_CONFIG[sport]?.path;
      if (!sportPath) {
        throw new Error(`Unsupported sport: ${sport}`);
      }

      // Format date as YYYYMMDD
      const dateStr = date 
        ? date.toISOString().slice(0, 10).replace(/-/g, '')
        : new Date().toISOString().slice(0, 10).replace(/-/g, '');

      const url = `${ESPN_API_BASE}/${sportPath}/scoreboard?dates=${dateStr}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.events || data.events.length === 0) {
        return [];
      }

      const games: GameUpdate[] = data.events.map((event: ESPNEvent) => {
        const competition = event.competitions[0];
        const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
        const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
        
        // Determine game status
        let status: 'scheduled' | 'in_progress' | 'final' = 'scheduled';
        if (competition.status.type.completed) {
          status = 'final';
        } else if (competition.status.type.state === 'in') {
          status = 'in_progress';
        }

        return {
          eventId: event.id,
          sport,
          homeTeamId: homeTeam?.team.id || '',
          homeTeamName: homeTeam?.team.displayName || '',
          homeTeamScore: homeTeam?.score ? parseInt(homeTeam.score) : null,
          homeTeamLogo: homeTeam?.team.logo || null,
          awayTeamId: awayTeam?.team.id || '',
          awayTeamName: awayTeam?.team.displayName || '',
          awayTeamScore: awayTeam?.score ? parseInt(awayTeam.score) : null,
          awayTeamLogo: awayTeam?.team.logo || null,
          status,
          statusDetail: competition.status.type.shortDetail || competition.status.type.detail,
          eventDate: new Date(competition.date),
          venue: competition.venue?.fullName || null
        };
      });

      return games;
    } catch (error) {
      console.error(`Error fetching ${sport} scoreboard:`, error);
      return [];
    }
  }

  /**
   * Get games for specific teams (checks past 2 days, today, and tomorrow)
   * This ensures completed games remain visible for 24+ hours after completion
   */
  async getTeamGames(sport: Sport, teamIds: string[]): Promise<GameUpdate[]> {
    try {
      // Check past 2 days, today, and tomorrow to ensure 24hr visibility for completed games
      const dates = [];
      for (let i = -2; i <= 1; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        dates.push(date);
      }

      // Fetch games for all dates
      const allGamesPromises = dates.map(date => this.getScoreboard(sport, date));
      const allGamesArrays = await Promise.all(allGamesPromises);
      const allGames = allGamesArrays.flat();
      
      // Filter games involving any of the specified teams
      const teamGames = allGames.filter(game => 
        teamIds.includes(game.homeTeamId) || teamIds.includes(game.awayTeamId)
      );

      // Remove duplicates (same eventId)
      const uniqueGames = Array.from(
        new Map(teamGames.map(game => [game.eventId, game])).values()
      );

      // Filter: show completed games only if finished within last 24 hours
      // Show scheduled/in-progress games always
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const filteredGames = uniqueGames.filter(game => {
        if (game.status === 'final') {
          // For completed games, show if event date is within last 24 hours
          return game.eventDate >= twentyFourHoursAgo;
        }
        // Always show scheduled and in-progress games
        return true;
      });

      return filteredGames;
    } catch (error) {
      console.error(`Error fetching team games:`, error);
      return [];
    }
  }

  /**
   * Get all available sports
   */
  getAvailableSports() {
    return Object.entries(SPORTS_CONFIG).map(([key, config]) => ({
      id: key as Sport,
      name: config.name,
      icon: config.icon,
      isIndividualSport: config.isIndividualSport
    }));
  }

  /**
   * Check if a sport is an individual sport (no teams)
   */
  isIndividualSport(sport: Sport): boolean {
    return SPORTS_CONFIG[sport]?.isIndividualSport ?? false;
  }

  /**
   * Get leaderboard for individual sports (golf, racing, tennis, combat)
   * Returns the current/most recent event with top 5 competitors
   * Filters to events within yesterday-to-tomorrow window (same as team sports)
   */
  async getIndividualSportLeaderboard(sport: Sport): Promise<IndividualSportUpdate | null> {
    try {
      const sportConfig = SPORTS_CONFIG[sport];
      if (!sportConfig || !sportConfig.isIndividualSport) {
        return null;
      }

      const sportPath = sportConfig.path;
      const url = `${ESPN_API_BASE}/${sportPath}/scoreboard`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.events || data.events.length === 0) {
        return null;
      }

      // For individual sports (golf, racing, etc.), prioritize events that are:
      // 1. Currently in progress (multi-day tournaments like PGA)
      // 2. Recently completed (within last 24 hours) - keep visible for 24hrs after completion
      // 3. Scheduled to start soon (within next 2 days)
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const twoDaysFromNow = new Date(now);
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      twoDaysFromNow.setHours(23, 59, 59, 999);

      // First, find any event that is currently IN PROGRESS - this handles multi-day tournaments
      const inProgressEvent = data.events.find((e: any) => {
        const competition = e.competitions?.[0];
        const stateType = competition?.status?.type?.state?.toLowerCase();
        return stateType === 'in';
      });

      if (inProgressEvent) {
        // Use the in-progress event (handles multi-day tournaments like PGA)
        var event = inProgressEvent;
      } else {
        // No in-progress event, fall back to date-based filtering
        // Look for recently completed or upcoming events
        // For completed events, check all events and include if recently completed
        const filteredEvents = data.events.filter((e: any) => {
          const competition = e.competitions?.[0];
          const stateType = competition?.status?.type?.state?.toLowerCase();
          const eventDate = new Date(e.date || competition?.date);
          
          // Include completed events - they will show for 24 hours after completion
          // Since we don't have exact completion time, we include all recently completed
          // and rely on ESPN API returning them in the scoreboard
          if (stateType === 'post') {
            // For tournaments, the event date is the start date
            // If it's completed and still in the scoreboard, show it
            return true;
          }
          
          // Include if scheduled within the next 2 days
          return eventDate >= twentyFourHoursAgo && eventDate <= twoDaysFromNow;
        });

        // Sort: prefer most recently completed or upcoming
        const sortedEvents = filteredEvents.sort((a: any, b: any) => {
          const stateA = a.competitions?.[0]?.status?.type?.state?.toLowerCase();
          const stateB = b.competitions?.[0]?.status?.type?.state?.toLowerCase();
          // Completed events first (more recent results), then scheduled
          if (stateA === 'post' && stateB !== 'post') return -1;
          if (stateB === 'post' && stateA !== 'post') return 1;
          return 0;
        });

        if (sortedEvents.length === 0) {
          return null;
        }

        var event = sortedEvents[0];
      }
      const competition = event.competitions?.[0];
      
      let status: 'scheduled' | 'in_progress' | 'final' = 'scheduled';
      let statusDetail = '';
      let topFive: LeaderboardEntry[] = [];

      if (competition) {
        const stateType = competition.status?.type?.state?.toLowerCase();
        if (stateType === 'in') {
          status = 'in_progress';
        } else if (stateType === 'post') {
          status = 'final';
        }
        statusDetail = competition.status?.type?.shortDetail || competition.status?.type?.detail || '';

        if (competition.competitors && Array.isArray(competition.competitors)) {
          const sortedCompetitors = [...competition.competitors]
            .filter((c: any) => c.order !== undefined || c.statistics)
            .sort((a: any, b: any) => {
              const orderA = a.order ?? (a.statistics?.find((s: any) => s.name === 'position')?.displayValue || 999);
              const orderB = b.order ?? (b.statistics?.find((s: any) => s.name === 'position')?.displayValue || 999);
              return Number(orderA) - Number(orderB);
            })
            .slice(0, 5);

          topFive = sortedCompetitors.map((c: any, index: number) => {
            const athleteName = c.athlete?.displayName || c.team?.displayName || c.displayName || 'Unknown';
            const lineScores = c.linescores?.map((l: any) => l.value);
            const score = c.score ?? (lineScores ? lineScores.join(' / ') : '');
            return {
              position: c.order || index + 1,
              name: athleteName,
              score: score.toString()
            };
          });
        }
      }

      if (topFive.length === 0 && event.competitors) {
        const sortedCompetitors = [...event.competitors]
          .sort((a: any, b: any) => (a.order || 999) - (b.order || 999))
          .slice(0, 5);

        topFive = sortedCompetitors.map((c: any, index: number) => ({
          position: c.order || index + 1,
          name: c.athlete?.displayName || c.displayName || 'Unknown',
          score: c.score?.toString() || ''
        }));
      }

      return {
        eventId: event.id,
        sport: sport,
        sportName: sportConfig.name,
        sportIcon: sportConfig.icon,
        eventName: event.name || event.shortName || 'Event',
        eventDate: new Date(event.date || competition?.date || new Date()),
        status,
        statusDetail,
        venue: competition?.venue?.fullName || null,
        topFive
      };
    } catch (error) {
      console.error(`Error fetching ${sport} leaderboard:`, error);
      return null;
    }
  }

  /**
   * Get leaderboards for all individual sports the user has selected
   */
  async getIndividualSportsUpdates(sports: Sport[]): Promise<IndividualSportUpdate[]> {
    const individualSports = sports.filter(sport => this.isIndividualSport(sport));
    
    if (individualSports.length === 0) {
      return [];
    }

    const leaderboardPromises = individualSports.map(sport => this.getIndividualSportLeaderboard(sport));
    const leaderboards = await Promise.all(leaderboardPromises);
    
    return leaderboards.filter((lb): lb is IndividualSportUpdate => lb !== null);
  }
}

export const espnService = new ESPNService();
