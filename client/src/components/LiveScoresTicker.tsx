import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function LiveScoresTicker() {
  const [sport, setSport] = useState("nba");
  const { data: games, isLoading } = trpc.stats.liveGames.useQuery(
    { sportKey: sport },
    { refetchInterval: 60_000, staleTime: 30_000 }
  );

  const sportColors: Record<string, string> = {
    nfl: "#00ff88",
    nba: "#00d4ff",
    mlb: "#a855f7",
    nhl: "#ff6b6b",
  };

  return (
    <div
      className="w-full py-2 overflow-x-auto"
      style={{
        background: "rgba(8, 8, 20, 0.6)",
        borderBottom: "1px solid rgba(0, 255, 136, 0.06)",
      }}
    >
      <div className="container">
        {/* Sport tabs */}
        <div className="flex items-center gap-3 mb-2">
          {["nba", "nfl", "mlb", "nhl"].map((s) => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded transition-all"
              style={{
                color: sport === s ? sportColors[s] : "rgba(140,140,170,0.6)",
                background: sport === s ? `${sportColors[s]}15` : "transparent",
                border: `1px solid ${sport === s ? `${sportColors[s]}40` : "transparent"}`,
                cursor: "pointer",
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
          <span className="ml-auto text-[9px] font-medium" style={{ color: "rgba(140,140,170,0.5)" }}>
            Auto-updates every 60s
          </span>
        </div>

        {/* Games */}
        {isLoading ? (
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded px-3 py-2 min-w-[180px]"
                style={{ background: "rgba(0,255,136,0.03)", border: "1px solid rgba(0,255,136,0.06)" }}
              >
                <div className="h-3 w-20 rounded" style={{ background: "rgba(0,255,136,0.08)" }} />
                <div className="h-3 w-16 rounded mt-1" style={{ background: "rgba(0,255,136,0.05)" }} />
              </div>
            ))}
          </div>
        ) : games && games.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
            {games.map((game) => (
              <div
                key={game.id}
                className="shrink-0 rounded px-3 py-2 min-w-[200px] transition-all"
                style={{
                  background: game.status === "live" ? "rgba(0,255,136,0.04)" : "rgba(12,12,28,0.6)",
                  border: `1px solid ${game.status === "live" ? "rgba(0,255,136,0.2)" : "rgba(0,255,136,0.06)"}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-[9px] font-bold tracking-wider px-1 py-0.5 rounded"
                    style={{
                      color: game.status === "live" ? "#00ff88" : game.status === "final" ? "rgba(140,140,170,0.7)" : "#00d4ff",
                      background: game.status === "live" ? "rgba(0,255,136,0.1)" : "transparent",
                    }}
                  >
                    {game.status === "live" ? "LIVE" : game.status === "final" ? "FINAL" : "UPCOMING"}
                  </span>
                  {game.broadcast && (
                    <span className="text-[8px]" style={{ color: "rgba(140,140,170,0.5)" }}>
                      {game.broadcast}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {game.awayLogo && <img src={game.awayLogo} alt="" className="w-4 h-4" />}
                    <span className="text-xs font-medium" style={{ color: "rgba(220,220,240,0.9)" }}>
                      {game.awayTeam?.split(" ").pop()}
                    </span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: "white" }}>
                    {game.awayScore}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <div className="flex items-center gap-1.5">
                    {game.homeLogo && <img src={game.homeLogo} alt="" className="w-4 h-4" />}
                    <span className="text-xs font-medium" style={{ color: "rgba(220,220,240,0.9)" }}>
                      {game.homeTeam?.split(" ").pop()}
                    </span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: "white" }}>
                    {game.homeScore}
                  </span>
                </div>
                <div className="text-[9px] mt-1" style={{ color: "rgba(140,140,170,0.6)" }}>
                  {game.statusDetail}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs py-2" style={{ color: "rgba(140,140,170,0.6)" }}>
            No games scheduled right now. Check back later!
          </div>
        )}
      </div>
    </div>
  );
}
