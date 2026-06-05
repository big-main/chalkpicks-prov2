/**
 * ESPN Public API Service
 * Fetches real-time scores, news, and player data from ESPN's public endpoints.
 * No API key required — these are the same endpoints ESPN.com uses.
 */

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const ESPN_NEWS = "https://site.api.espn.com/apis/site/v2/sports";

type SportKey = "nfl" | "nba" | "mlb" | "nhl" | "soccer";

const SPORT_PATHS: Record<SportKey, string> = {
  nfl: "football/nfl",
  nba: "basketball/nba",
  mlb: "baseball/mlb",
  nhl: "hockey/nhl",
  soccer: "soccer/usa.1",
};

// ─── Cache layer (5-minute TTL for scores, 15-min for news) ─────────────────
const cache = new Map<string, { data: any; expires: number }>();

function getCached(key: string, ttlMs: number): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expires) return entry.data;
  return null;
}

function setCache(key: string, data: any, ttlMs: number) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

// ─── Fetch with timeout and error handling ──────────────────────────────────
async function espnFetch(url: string, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`ESPN API ${res.status}`);
    return await res.json();
  } catch (err: any) {
    if (err.name === "AbortError") throw new Error("ESPN API timeout");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Live Scores ────────────────────────────────────────────────────────────
export interface LiveGame {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "live" | "scheduled" | "final";
  statusDetail: string;
  gameTime?: string;
  venue: string;
  homeLogo?: string;
  awayLogo?: string;
  broadcast?: string;
}

export async function getLiveScores(sport: SportKey = "nba"): Promise<LiveGame[]> {
  const cacheKey = `scores_${sport}`;
  const cached = getCached(cacheKey, 60_000); // 1-min cache for live scores
  if (cached) return cached;

  try {
    const path = SPORT_PATHS[sport];
    if (!path) return [];
    const data = await espnFetch(`${ESPN_BASE}/${path}/scoreboard`);
    
    const games: LiveGame[] = (data.events || []).map((event: any) => {
      const competition = event.competitions?.[0];
      const home = competition?.competitors?.find((c: any) => c.homeAway === "home");
      const away = competition?.competitors?.find((c: any) => c.homeAway === "away");
      const statusType = competition?.status?.type?.name;
      
      let status: "live" | "scheduled" | "final" = "scheduled";
      if (statusType === "STATUS_IN_PROGRESS" || statusType === "STATUS_HALFTIME") status = "live";
      else if (statusType === "STATUS_FINAL") status = "final";

      return {
        id: event.id,
        sport,
        homeTeam: home?.team?.displayName || "TBD",
        awayTeam: away?.team?.displayName || "TBD",
        homeScore: parseInt(home?.score || "0"),
        awayScore: parseInt(away?.score || "0"),
        status,
        statusDetail: competition?.status?.type?.shortDetail || "",
        gameTime: event.date,
        venue: competition?.venue?.fullName || "",
        homeLogo: home?.team?.logo,
        awayLogo: away?.team?.logo,
        broadcast: competition?.broadcasts?.[0]?.names?.[0] || "",
      };
    });

    setCache(cacheKey, games, 60_000);
    return games;
  } catch (err) {
    console.error(`[ESPN] Error fetching ${sport} scores:`, err);
    return [];
  }
}

// ─── News Headlines ─────────────────────────────────────────────────────────
export interface NewsItem {
  id: string;
  headline: string;
  description: string;
  link: string;
  published: string;
  sport: string;
  image?: string;
}

export async function getNews(sport: SportKey = "nba"): Promise<NewsItem[]> {
  const cacheKey = `news_${sport}`;
  const cached = getCached(cacheKey, 900_000); // 15-min cache for news
  if (cached) return cached;

  try {
    const path = SPORT_PATHS[sport];
    if (!path) return [];
    const data = await espnFetch(`${ESPN_BASE}/${path}/news`);
    
    const articles: NewsItem[] = (data.articles || []).slice(0, 10).map((article: any) => ({
      id: article.id || String(Math.random()),
      headline: article.headline || "",
      description: article.description || "",
      link: article.links?.web?.href || `https://espn.com`,
      published: article.published || new Date().toISOString(),
      sport,
      image: article.images?.[0]?.url,
    }));

    setCache(cacheKey, articles, 900_000);
    return articles;
  } catch (err) {
    console.error(`[ESPN] Error fetching ${sport} news:`, err);
    return [];
  }
}

// ─── All Sports News (combined ticker) ──────────────────────────────────────
export async function getAllSportsNews(): Promise<NewsItem[]> {
  const cacheKey = "news_all";
  const cached = getCached(cacheKey, 600_000); // 10-min cache
  if (cached) return cached;

  try {
    const sports: SportKey[] = ["nfl", "nba", "mlb", "nhl"];
    const results = await Promise.allSettled(
      sports.map(s => getNews(s))
    );
    
    const allNews: NewsItem[] = [];
    results.forEach((r) => {
      if (r.status === "fulfilled") allNews.push(...r.value);
    });

    // Sort by published date, newest first
    allNews.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
    const top = allNews.slice(0, 20);
    setCache(cacheKey, top, 600_000);
    return top;
  } catch (err) {
    console.error("[ESPN] Error fetching all news:", err);
    return [];
  }
}

// ─── Top Athletes ───────────────────────────────────────────────────────────
export interface Athlete {
  id: string;
  name: string;
  team: string;
  position: string;
  headshot?: string;
  stats?: Record<string, any>;
}

export async function getTopAthletes(sport: SportKey = "nba"): Promise<Athlete[]> {
  const cacheKey = `athletes_${sport}`;
  const cached = getCached(cacheKey, 3600_000); // 1-hour cache
  if (cached) return cached;

  try {
    const path = SPORT_PATHS[sport];
    if (!path) return [];
    const data = await espnFetch(`${ESPN_BASE}/${path}/athletes?limit=20`);
    
    const athletes: Athlete[] = (data.items || data.athletes || []).slice(0, 15).map((a: any) => ({
      id: a.id || String(Math.random()),
      name: a.displayName || a.fullName || "Unknown",
      team: a.team?.displayName || "",
      position: a.position?.abbreviation || "",
      headshot: a.headshot?.href,
    }));

    setCache(cacheKey, athletes, 3600_000);
    return athletes;
  } catch (err) {
    console.error(`[ESPN] Error fetching ${sport} athletes:`, err);
    return [];
  }
}

// ─── Standings ──────────────────────────────────────────────────────────────
export async function getStandings(sport: SportKey = "nba"): Promise<any> {
  const cacheKey = `standings_${sport}`;
  const cached = getCached(cacheKey, 3600_000); // 1-hour cache
  if (cached) return cached;

  try {
    const path = SPORT_PATHS[sport];
    if (!path) return null;
    const data = await espnFetch(`${ESPN_BASE}/${path}/standings`);
    setCache(cacheKey, data, 3600_000);
    return data;
  } catch (err) {
    console.error(`[ESPN] Error fetching ${sport} standings:`, err);
    return null;
  }
}
