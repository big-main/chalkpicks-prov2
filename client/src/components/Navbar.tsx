import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Menu, X, Zap, ChevronDown, Bell, Crown, TrendingUp, BarChart3, Calculator, Layers } from "lucide-react";
import { trpc } from "@/lib/trpc";

const navLinks = [
  { href: "/picks", label: "Picks" },
  { href: "/stats", label: "Live Stats" },
  { href: "/ev-finder", label: "+EV Finder" },
  { href: "/backtesting", label: "Backtest" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/tools", label: "Tools" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: notifCount } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const isPremium = user?.subscriptionTier && user.subscriptionTier !== "free";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(8, 8, 20, 0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0, 255, 136, 0.12)",
      }}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 flex items-center justify-center transition-all group-hover:scale-105"
              style={{
                border: "1.5px solid #00ff88",
                borderRadius: "6px",
                boxShadow: "0 0 10px rgba(0,255,136,0.3), inset 0 0 8px rgba(0,255,136,0.08)",
              }}
            >
              <Zap className="w-4 h-4" style={{ color: "#00ff88" }} />
            </div>
            <span
              className="font-display text-xl text-white"
              style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}
            >
              CHALK<span style={{ color: "#00ff88", textShadow: "0 0 10px rgba(0,255,136,0.5)" }}>PICKS</span>
            </span>
            <span
              className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold tracking-widest"
              style={{
                background: "rgba(0,255,136,0.1)",
                border: "1px solid rgba(0,255,136,0.3)",
                borderRadius: "3px",
                color: "#00ff88",
              }}
            >
              PRO
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium rounded transition-all"
                style={{
                  fontFamily: "'Exo 2', sans-serif",
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                  color: location === link.href ? "#00ff88" : "rgba(200,200,220,0.75)",
                  background: location === link.href ? "rgba(0,255,136,0.08)" : "transparent",
                  textShadow: location === link.href ? "0 0 8px rgba(0,255,136,0.4)" : "none",
                  borderBottom: location === link.href ? "1px solid rgba(0,255,136,0.4)" : "1px solid transparent",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link href="/notifications">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    style={{ color: "rgba(200,200,220,0.7)" }}
                  >
                    <Bell className="w-4 h-4" />
                    {notifCount && notifCount.count > 0 ? (
                      <span
                        className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] rounded-full flex items-center justify-center font-bold"
                        style={{ background: "#ff4d8f", color: "#080814" }}
                      >
                        {notifCount.count > 9 ? "9+" : notifCount.count}
                      </span>
                    ) : null}
                  </Button>
                </Link>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 px-2"
                      style={{ color: "rgba(200,200,220,0.85)" }}
                    >
                      <Avatar className="w-7 h-7">
                        <AvatarFallback
                          className="text-xs font-bold"
                          style={{ background: "rgba(0,255,136,0.15)", color: "#00ff88", border: "1px solid rgba(0,255,136,0.3)" }}
                        >
                          {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium max-w-24 truncate">
                        {user?.name ?? "User"}
                      </span>
                      {isPremium && <Crown className="w-3 h-3 hidden sm:block" style={{ color: "#00ff88" }} />}
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48"
                    style={{ background: "rgba(12,12,28,0.98)", border: "1px solid rgba(0,255,136,0.2)" }}
                  >
                    <div className="px-2 py-1.5">
                      <p className="text-xs text-muted-foreground">Signed in as</p>
                      <p className="text-sm font-medium truncate">{user?.email ?? user?.name}</p>
                      <Badge className="mt-1 text-[10px] capitalize badge-premium border-0">
                        {user?.subscriptionTier ?? "free"}
                      </Badge>
                    </div>
                    <DropdownMenuSeparator style={{ borderColor: "rgba(0,255,136,0.1)" }} />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">My Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/tools">Power Tools</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/pricing">Upgrade Plan</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator style={{ borderColor: "rgba(0,255,136,0.1)" }} />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="text-destructive focus:text-destructive"
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex"
                  style={{ color: "rgba(200,200,220,0.7)" }}
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Sign In
                </Button>
                <button
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-bold tracking-wider transition-all"
                  style={{
                    background: "#00ff88",
                    color: "#080814",
                    borderRadius: "4px",
                    fontFamily: "'Exo 2', sans-serif",
                    boxShadow: "0 0 15px rgba(0,255,136,0.3)",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 25px rgba(0,255,136,0.5), 0 0 50px rgba(0,255,136,0.2)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 15px rgba(0,255,136,0.3)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  <Zap className="w-3.5 h-3.5" />
                  LAUNCH APP
                </button>
              </>
            )}

            {/* Mobile toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              style={{ color: "rgba(200,200,220,0.7)" }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="lg:hidden py-3 space-y-1"
            style={{ borderTop: "1px solid rgba(0,255,136,0.12)" }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium rounded transition-all"
                style={{
                  color: location === link.href ? "#00ff88" : "rgba(200,200,220,0.75)",
                  background: location === link.href ? "rgba(0,255,136,0.08)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="pt-2" style={{ borderTop: "1px solid rgba(0,255,136,0.12)" }}>
                <button
                  className="w-full py-2.5 text-sm font-bold tracking-wider"
                  style={{
                    background: "#00ff88",
                    color: "#080814",
                    borderRadius: "4px",
                    fontFamily: "'Exo 2', sans-serif",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  LAUNCH APP FREE
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
