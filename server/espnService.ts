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

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

// Supported sports configurations
const SPORTS_CONFIG = {
  nfl: {
    path: 'football/nfl',
    name: 'NFL',
    icon: '🏈'
  },
  cfb: {
    path: 'football/college-football',
    name: 'College Football',
    icon: '🏈'
  },
  nba: {
    path: 'basketball/nba',
    name: 'NBA',
    icon: '🏀'
  },
  cbb: {
    path: 'basketball/mens-college-basketball',
    name: 'College Basketball',
    icon: '🏀'
  },
  mlb: {
    path: 'baseball/mlb',
    name: 'MLB',
    icon: '⚾'
  },
  nhl: {
    path: 'hockey/nhl',
    name: 'NHL',
    icon: '🏒'
  },
  soccer: {
    path: 'soccer/usa.1', // MLS
    name: 'MLS',
    icon: '⚽'
  },
  nascar: {
    path: 'racing/nascar-premier',
    name: 'NASCAR Cup Series',
    icon: '🏎️'
  },
  xfinity: {
    path: 'racing/nascar-secondary',
    name: 'NASCAR Xfinity',
    icon: '🏎️'
  },
  truck: {
    path: 'racing/nascar-truck',
    name: 'NASCAR Truck Series',
    icon: '🏁'
  },
  f1: {
    path: 'racing/f1',
    name: 'Formula 1',
    icon: '🏎️'
  },
  indycar: {
    path: 'racing/irl',
    name: 'IndyCar',
    icon: '🏎️'
  },
  nhra: {
    path: 'racing/nhra',
    name: 'NHRA Drag Racing',
    icon: '🏁'
  },
  wnba: {
    path: 'basketball/wnba',
    name: 'WNBA',
    icon: '🏀'
  },
  wcbb: {
    path: 'basketball/womens-college-basketball',
    name: "Women's College Basketball",
    icon: '🏀'
  },
  lpga: {
    path: 'golf/lpga',
    name: 'LPGA',
    icon: '⛳'
  },
  wta: {
    path: 'tennis/wta',
    name: 'WTA Tennis',
    icon: '🎾'
  },
  ufc: {
    path: 'mma/ufc',
    name: 'UFC/MMA',
    icon: '🥊'
  },
  boxing: {
    path: 'boxing/boxing',
    name: 'Boxing',
    icon: '🥊'
  },
  premierleague: {
    path: 'soccer/eng.1',
    name: 'Premier League',
    icon: '⚽'
  },
  laliga: {
    path: 'soccer/esp.1',
    name: 'La Liga',
    icon: '⚽'
  },
  seriea: {
    path: 'soccer/ita.1',
    name: 'Serie A',
    icon: '⚽'
  },
  bundesliga: {
    path: 'soccer/ger.1',
    name: 'Bundesliga',
    icon: '⚽'
  },
  championsleague: {
    path: 'soccer/uefa.champions',
    name: 'Champions League',
    icon: '⚽'
  },
  collegebb: {
    path: 'baseball/college-baseball',
    name: 'College Baseball',
    icon: '⚾'
  },
  mcollegehockey: {
    path: 'hockey/mens-college-hockey',
    name: "Men's College Hockey",
    icon: '🏒'
  },
  wcollegehockey: {
    path: 'hockey/womens-college-hockey',
    name: "Women's College Hockey",
    icon: '🏒'
  },
  pga: {
    path: 'golf/pga',
    name: 'PGA Tour',
    icon: '⛳'
  },
  atp: {
    path: 'tennis/atp',
    name: 'ATP Tennis',
    icon: '🎾'
  },
  rugby: {
    path: 'rugby/rugby',
    name: 'Rugby',
    icon: '🏉'
  },
  cricket: {
    path: 'cricket/cricket',
    name: 'Cricket',
    icon: '🏏'
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

      const url = `${ESPN_API_BASE}/${sportPath}/teams?limit=100`;
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
   * Get games for specific teams (checks yesterday, today, and tomorrow)
   */
  async getTeamGames(sport: Sport, teamIds: string[]): Promise<GameUpdate[]> {
    try {
      // Check yesterday, today, and tomorrow to avoid overwhelming the feed
      const dates = [];
      for (let i = -1; i <= 1; i++) {
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

      return uniqueGames;
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
      icon: config.icon
    }));
  }
}

export const espnService = new ESPNService();
