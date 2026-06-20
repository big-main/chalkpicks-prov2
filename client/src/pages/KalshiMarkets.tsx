import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, AlertCircle, Search } from "lucide-react";

export default function KalshiMarkets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("sports");

  // Fetch markets by category
  const sportsMarkets = trpc.kalshi.getSportsMarkets.useQuery();
  const politicsMarkets = trpc.kalshi.getPoliticsMarkets.useQuery();
  const cryptoMarkets = trpc.kalshi.getCryptoMarkets.useQuery();
  const trendingMarkets = trpc.kalshi.getTrendingMarkets.useQuery();
  const marketAlerts = trpc.kalshi.getMarketAlerts.useQuery();
  const searchResults = trpc.kalshi.searchMarkets.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: searchQuery.length > 2 }
  );

  const getMarketsByTab = () => {
    if (searchQuery.length > 2) {
      return searchResults.data || [];
    }
    switch (activeTab) {
      case "sports":
        return sportsMarkets.data || [];
      case "politics":
        return politicsMarkets.data || [];
      case "crypto":
        return cryptoMarkets.data || [];
      case "trending":
        return trendingMarkets.data || [];
      default:
        return [];
    }
  };

  const markets = getMarketsByTab();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Kalshi Markets
            </span>
          </h1>
          <p className="text-slate-400">Real-time prediction market analysis and trading signals</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          <Input
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500"
          />
        </div>

        {/* Market Alerts */}
        {marketAlerts.data && marketAlerts.data.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {marketAlerts.data.slice(0, 3).map((alert) => (
              <Card
                key={alert.market.id}
                className="bg-slate-800 border-amber-500/30 p-4 hover:border-amber-500/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm mb-1">{alert.market.title}</h3>
                    <p className="text-xs text-slate-400 mb-2">
                      {alert.sharp_money_detected ? "⚡ Sharp Money Detected" : "Line Movement Alert"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded">
                        {alert.trading_signal.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400">{alert.confidence_score}% confidence</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="sports">Sports</TabsTrigger>
            <TabsTrigger value="politics">Politics</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          {/* Markets Grid */}
          {["sports", "politics", "crypto", "trending"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {markets.length > 0 ? (
                  markets.map((market) => (
                    <MarketCard key={market.id} market={market} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-slate-400">No markets found</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

function MarketCard({ market }: { market: any }) {
  const analyzeMarket = trpc.kalshi.analyzeMarket.useQuery({ marketId: market.id });
  const analysis = analyzeMarket.data;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return "text-emerald-400";
      case "bearish":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "buy_yes":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "buy_no":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 p-4 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
      <div className="mb-3">
        <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">{market.title}</h3>
        <p className="text-xs text-slate-400">{market.category}</p>
      </div>

      {/* Price Display */}
      <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-slate-900 rounded border border-slate-700">
        <div>
          <p className="text-xs text-slate-400 mb-1">YES</p>
          <p className="text-lg font-bold text-emerald-400">${market.yes_price.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">NO</p>
          <p className="text-lg font-bold text-red-400">${market.no_price.toFixed(2)}</p>
        </div>
      </div>

      {/* Volume & Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div>
          <p className="text-slate-500">Volume</p>
          <p className="text-white font-semibold">${(market.volume / 1000).toFixed(0)}K</p>
        </div>
        <div>
          <p className="text-slate-500">Expires</p>
          <p className="text-white font-semibold">{new Date(market.expiration_date).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Analysis */}
      {analysis && (
        <div className="space-y-2 mb-4 p-3 bg-slate-800 rounded border border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Sentiment</span>
            <span className={`text-xs font-semibold ${getSentimentColor(analysis.market_sentiment)}`}>
              {analysis.market_sentiment.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Confidence</span>
            <span className="text-xs font-semibold text-cyan-400">{analysis.confidence_score}%</span>
          </div>
          {analysis.sharp_money_detected && (
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <AlertCircle className="w-3 h-3" />
              <span>Sharp Money Detected</span>
            </div>
          )}
        </div>
      )}

      {/* Trading Signal */}
      {analysis && (
        <Button
          className={`w-full text-xs font-semibold border ${getSignalColor(analysis.trading_signal)}`}
          variant="outline"
        >
          {analysis.trading_signal === "buy_yes"
            ? "🟢 BUY YES"
            : analysis.trading_signal === "buy_no"
              ? "🔴 BUY NO"
              : "⏸️ HOLD"}
        </Button>
      )}
    </Card>
  );
}
