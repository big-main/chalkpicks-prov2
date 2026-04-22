import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Target, Clock } from "lucide-react";

const SPORTS = ["NFL", "NBA", "MLB", "NHL", "Soccer"];

const MATCHUP_DATA = {
  homeTeam: "Kansas City Chiefs",
  awayTeam: "Las Vegas Raiders",
  sport: "NFL",
  date: "2026-04-25",
  venue: "Arrowhead Stadium, Kansas City, MO",
  
  headToHead: [
    { year: 2024, homeWins: 2, awayWins: 0, pushes: 0 },
    { year: 2023, homeWins: 2, awayWins: 0, pushes: 0 },
    { year: 2022, homeWins: 1, awayWins: 1, pushes: 0 },
  ],
  
  homeStats: {
    team: "Kansas City Chiefs",
    record: "12-5",
    offensiveRank: 3,
    defensiveRank: 8,
    homeRecord: "7-2",
    avgPointsFor: 26.4,
    avgPointsAgainst: 19.8,
    keyPlayers: [
      { name: "Patrick Mahomes", position: "QB", stats: "94.3 rating at home" },
      { name: "Travis Kelce", position: "TE", stats: "1,229 yards, 9 TD" },
      { name: "Rashee Rice", position: "WR", stats: "938 yards, 7 TD" },
    ],
  },
  
  awayStats: {
    team: "Las Vegas Raiders",
    record: "8-9",
    offensiveRank: 18,
    defensiveRank: 28,
    awayRecord: "4-5",
    avgPointsFor: 21.2,
    avgPointsAgainst: 24.6,
    keyPlayers: [
      { name: "Derek Carr", position: "QB", stats: "78.1 rating on road" },
      { name: "Josh Jacobs", position: "RB", stats: "1,150 yards, 8 TD" },
      { name: "Davante Adams", position: "WR", stats: "1,144 yards, 8 TD" },
    ],
  },
  
  injuryReport: [
    { team: "Chiefs", player: "Chris Jones", position: "DT", status: "Questionable" },
    { team: "Chiefs", player: "L'Jarius Sneed", position: "CB", status: "Probable" },
    { team: "Raiders", player: "Darren Waller", position: "TE", status: "Out" },
  ],
  
  oddsHistory: [
    { date: "Mon", chiefs: -7.5, over: 47.5 },
    { date: "Tue", chiefs: -7.0, over: 47.0 },
    { date: "Wed", chiefs: -7.5, over: 47.5 },
    { date: "Thu", chiefs: -8.0, over: 48.0 },
    { date: "Fri", chiefs: -7.5, over: 47.5 },
  ],
  
  trends: [
    { metric: "Home Wins", value: 73 },
    { metric: "Away Wins", value: 27 },
  ],
};

export default function MatchupAnalysis() {
  const { user } = useAuth();
  const [selectedSport, setSelectedSport] = React.useState("NFL");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Matchup Analysis</h1>
            <p className="text-muted-foreground">Deep dive into head-to-head statistics and trends</p>
          </div>

          {/* Sport Tabs */}
          <Tabs value={selectedSport} onValueChange={setSelectedSport} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {SPORTS.map((sport) => (
                <TabsTrigger key={sport} value={sport}>
                  {sport}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Matchup Header */}
        <div className="mb-8">
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center flex-1">
                <h2 className="text-2xl font-bold text-foreground">{MATCHUP_DATA.homeTeam}</h2>
                <p className="text-sm text-muted-foreground">{MATCHUP_DATA.homeStats.record}</p>
              </div>
              <div className="px-6">
                <p className="text-sm text-muted-foreground">vs</p>
                <p className="text-xs text-muted-foreground mt-1">{MATCHUP_DATA.date}</p>
              </div>
              <div className="text-center flex-1">
                <h2 className="text-2xl font-bold text-foreground">{MATCHUP_DATA.awayTeam}</h2>
                <p className="text-sm text-muted-foreground">{MATCHUP_DATA.awayStats.record}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">{MATCHUP_DATA.venue}</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Home Team Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{MATCHUP_DATA.homeStats.team}</CardTitle>
              <CardDescription>Home Team Analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Home Record</span>
                  <span className="font-semibold text-foreground">{MATCHUP_DATA.homeStats.homeRecord}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Points For</span>
                  <span className="font-semibold text-green-400">{MATCHUP_DATA.homeStats.avgPointsFor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Points Against</span>
                  <span className="font-semibold text-red-400">{MATCHUP_DATA.homeStats.avgPointsAgainst}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Offensive Rank</span>
                  <Badge variant="outline">#{MATCHUP_DATA.homeStats.offensiveRank}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Defensive Rank</span>
                  <Badge variant="outline">#{MATCHUP_DATA.homeStats.defensiveRank}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Away Team Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{MATCHUP_DATA.awayStats.team}</CardTitle>
              <CardDescription>Away Team Analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Away Record</span>
                  <span className="font-semibold text-foreground">{MATCHUP_DATA.awayStats.awayRecord}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Points For</span>
                  <span className="font-semibold text-green-400">{MATCHUP_DATA.awayStats.avgPointsFor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Points Against</span>
                  <span className="font-semibold text-red-400">{MATCHUP_DATA.awayStats.avgPointsAgainst}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Offensive Rank</span>
                  <Badge variant="outline">#{MATCHUP_DATA.awayStats.offensiveRank}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Defensive Rank</span>
                  <Badge variant="outline">#{MATCHUP_DATA.awayStats.defensiveRank}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Head-to-Head Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                H2H Trends
              </CardTitle>
              <CardDescription>Last 3 Matchups</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={MATCHUP_DATA.trends} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    <Cell fill="#fbbf24" />
                    <Cell fill="#ef4444" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Key Players */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {MATCHUP_DATA.homeStats.team} Key Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MATCHUP_DATA.homeStats.keyPlayers.map((player, idx) => (
                  <div key={idx} className="flex justify-between items-start pb-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-semibold text-foreground">{player.name}</p>
                      <p className="text-xs text-muted-foreground">{player.position}</p>
                    </div>
                    <p className="text-sm text-accent">{player.stats}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {MATCHUP_DATA.awayStats.team} Key Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MATCHUP_DATA.awayStats.keyPlayers.map((player, idx) => (
                  <div key={idx} className="flex justify-between items-start pb-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-semibold text-foreground">{player.name}</p>
                      <p className="text-xs text-muted-foreground">{player.position}</p>
                    </div>
                    <p className="text-sm text-accent">{player.stats}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Injury Report */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Injury Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MATCHUP_DATA.injuryReport.map((injury, idx) => (
                <div key={idx} className="flex justify-between items-center pb-3 border-b border-border last:border-0">
                  <div>
                    <p className="font-semibold text-foreground">{injury.player}</p>
                    <p className="text-xs text-muted-foreground">{injury.team} • {injury.position}</p>
                  </div>
                  <Badge variant={injury.status === "Out" ? "destructive" : "secondary"}>
                    {injury.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Odds Movement */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Odds Movement
            </CardTitle>
            <CardDescription>5-Day Line Movement</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={MATCHUP_DATA.oddsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                <Legend />
                <Line type="monotone" dataKey="chiefs" stroke="#fbbf24" name="Chiefs Spread" strokeWidth={2} />
                <Line type="monotone" dataKey="over" stroke="#60a5fa" name="Over Total" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Head-to-Head History */}
        <Card>
          <CardHeader>
            <CardTitle>Head-to-Head History</CardTitle>
            <CardDescription>Recent Matchup Results</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={MATCHUP_DATA.headToHead}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="year" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                <Legend />
                <Bar dataKey="homeWins" fill="#22c55e" name="Home Wins" />
                <Bar dataKey="awayWins" fill="#ef4444" name="Away Wins" />
                <Bar dataKey="pushes" fill="#888888" name="Pushes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import React from "react";
