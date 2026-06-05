import { trpc } from "@/lib/trpc";
import { useEffect, useState, useRef } from "react";
import { Activity } from "lucide-react";

export default function LiveNewsTicker() {
  const { data: news } = trpc.stats.allNews.useQuery(undefined, {
    refetchInterval: 300_000, // Refresh every 5 minutes
    staleTime: 120_000,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!news || news.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [news]);

  const sportColors: Record<string, string> = {
    nfl: "#00ff88",
    nba: "#00d4ff",
    mlb: "#a855f7",
    nhl: "#ff6b6b",
    soccer: "#fbbf24",
  };

  if (!news || news.length === 0) {
    return (
      <div
        className="w-full overflow-hidden py-1.5"
        style={{
          background: "rgba(0, 255, 136, 0.03)",
          borderBottom: "1px solid rgba(0, 255, 136, 0.08)",
        }}
      >
        <div className="container flex items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <Activity className="w-3 h-3" style={{ color: "#00ff88" }} />
            <span className="text-[10px] font-bold tracking-widest" style={{ color: "#00ff88" }}>
              LIVE
            </span>
          </div>
          <span className="text-xs" style={{ color: "rgba(200,200,220,0.6)" }}>
            Loading sports news...
          </span>
        </div>
      </div>
    );
  }

  const currentNews = news[currentIndex];
  const sportColor = sportColors[currentNews?.sport] || "#00d4ff";

  return (
    <div
      className="w-full overflow-hidden py-1.5"
      style={{
        background: "rgba(0, 255, 136, 0.03)",
        borderBottom: "1px solid rgba(0, 255, 136, 0.08)",
      }}
    >
      <div className="container flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="live-dot" />
          <span className="text-[10px] font-bold tracking-widest" style={{ color: "#00ff88" }}>
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-hidden" ref={tickerRef}>
          <span
            className="text-[10px] font-bold tracking-wider shrink-0 px-1.5 py-0.5 rounded"
            style={{
              color: sportColor,
              background: `${sportColor}15`,
              border: `1px solid ${sportColor}30`,
            }}
          >
            {currentNews?.sport?.toUpperCase()}
          </span>
          <span
            className="text-xs font-medium truncate transition-all duration-500"
            style={{ color: "rgba(200,200,220,0.85)" }}
            key={currentIndex}
          >
            {currentNews?.headline}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 ml-auto shrink-0">
          {["NFL", "NBA", "MLB", "NHL"].map((s) => (
            <span
              key={s}
              className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded cursor-pointer transition-all"
              style={{
                color: sportColors[s.toLowerCase()] || "#00d4ff",
                background: `${sportColors[s.toLowerCase()] || "#00d4ff"}10`,
                border: `1px solid ${sportColors[s.toLowerCase()] || "#00d4ff"}20`,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
