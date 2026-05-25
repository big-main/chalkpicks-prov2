import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy, Download } from "lucide-react";

export default function WebScraper() {
  const [url, setUrl] = useState("");
  const [scrapedContent, setScrapedContent] = useState<string>("");
  const [extractedData, setExtractedData] = useState<Record<string, any> | null>(null);

  const scrapeUrlMutation = trpc.firecrawl.scrapeUrl.useMutation();
  const extractDataQuery = trpc.firecrawl.extractData.useQuery(
    { content: scrapedContent },
    { enabled: scrapedContent.length > 0 }
  );

  const handleScrape = async () => {
    if (!url) return;

    try {
      const result = await scrapeUrlMutation.mutateAsync({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      });

      if (result.success && result.data?.content) {
        setScrapedContent(result.data.content);
        setExtractedData(null);
      }
    } catch (error) {
      console.error("Scraping failed:", error);
    }
  };

  const handleExtract = () => {
    if (extractDataQuery.data) {
      setExtractedData(extractDataQuery.data);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([scrapedContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `scraped-content-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Web Scraper</h1>
          <p className="text-gray-400">
            Scrape sports news, odds, and betting data from any website using Firecrawl
          </p>
        </div>

        {/* Input Section */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Scrape URL</CardTitle>
            <CardDescription>Enter a URL to scrape content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <Button
                onClick={handleScrape}
                disabled={!url || scrapeUrlMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {scrapeUrlMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  "Scrape"
                )}
              </Button>
            </div>

            {scrapeUrlMutation.error && (
              <div className="p-3 bg-red-900 border border-red-700 rounded text-red-200">
                {scrapeUrlMutation.error.message}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scraped Content */}
        {scrapedContent && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Scraped Content</CardTitle>
                <CardDescription>{scrapedContent.length} characters</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(scrapedContent)}
                  className="border-slate-600"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  className="border-slate-600"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={scrapedContent}
                readOnly
                className="bg-slate-700 border-slate-600 text-white h-64 font-mono text-sm"
              />
            </CardContent>
          </Card>
        )}

        {/* Extract Betting Data */}
        {scrapedContent && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Extract Betting Data</CardTitle>
              <CardDescription>Extract odds, teams, and scores from content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleExtract}
                disabled={extractDataQuery.isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {extractDataQuery.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  "Extract Data"
                )}
              </Button>

              {extractedData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-700 p-4 rounded">
                      <h3 className="text-sm font-semibold text-gray-300 mb-2">Odds Found</h3>
                      <div className="space-y-1">
                        {(extractedData.odds as string[]).slice(0, 5).map((odd, i) => (
                          <div key={i} className="text-white font-mono text-sm">
                            {odd}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-700 p-4 rounded">
                      <h3 className="text-sm font-semibold text-gray-300 mb-2">Teams Found</h3>
                      <div className="space-y-1">
                        {(extractedData.teams as string[]).slice(0, 5).map((team, i) => (
                          <div key={i} className="text-white font-mono text-sm">
                            {team}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-700 p-4 rounded">
                      <h3 className="text-sm font-semibold text-gray-300 mb-2">Scores Found</h3>
                      <div className="space-y-1">
                        {(extractedData.scores as string[]).slice(0, 5).map((score, i) => (
                          <div key={i} className="text-white font-mono text-sm">
                            {score}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-700 p-4 rounded">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Raw Content Preview</h3>
                    <p className="text-white text-sm font-mono whitespace-pre-wrap break-words">
                      {extractedData.rawContent}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Quick Scrape</CardTitle>
            <CardDescription>Scrape popular sports betting sites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {[
                { name: "ESPN", url: "https://www.espn.com/" },
                { name: "DraftKings", url: "https://www.draftkings.com/" },
                { name: "FanDuel", url: "https://www.fanduel.com/" },
                { name: "BetMGM", url: "https://www.betmgm.com/" },
              ].map((site) => (
                <Button
                  key={site.name}
                  variant="outline"
                  onClick={() => {
                    setUrl(site.url);
                    setScrapedContent("");
                    setExtractedData(null);
                  }}
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  {site.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
