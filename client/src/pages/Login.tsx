import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AuthPageShell from "@/components/AuthPageShell";
import { Lock } from "lucide-react";

const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,212,255,0.2)", color: "white" };

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [elevateEmail, setElevateEmail] = useState("");

  const elevateMutation = trpc.auth.elevateToAdmin.useMutation({
    onSuccess: () => {
      alert("User elevated to admin successfully!");
      setElevateEmail("");
    },
    onError: (err) => {
      alert("Elevation failed: " + err.message);
    }
  });

  const handleElevate = (e: React.FormEvent) => {
    e.preventDefault();
    if (elevateEmail) elevateMutation.mutate({ email: elevateEmail });
  };

  useEffect(() => {
    if (isAuthenticated) setLocation("/");
  }, [isAuthenticated, setLocation]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/");
    },
    onError: (err) => setError(err.message || "Invalid email or password"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please enter your email and password"); return; }
    loginMutation.mutate({ email, password });
  };

  return (
    <AuthPageShell rightLink={{ href: "/signup", label: "Sign Up" }}>
      <div className="text-center mb-8">
        <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "2.5rem", textTransform: "uppercase", color: "white", lineHeight: 1.2 }}>
          Welcome{" "}
          <span style={{ background: "linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Back
          </span>
        </h1>
        <p style={{ color: "#a8a8b0", fontSize: "1rem", marginTop: "1rem" }}>
          Access your picks, stats, and advanced betting tools
        </p>
      </div>

      <Card style={{ background: "rgba(20,20,30,0.8)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "8px", marginBottom: "2rem" }}>
        <CardHeader>
          <CardTitle style={{ color: "white", fontSize: "1.5rem" }}>Log In to Your Account</CardTitle>
          <CardDescription style={{ color: "#a8a8b0" }}>Enter your email and password to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: "#a8a8b0" }}>Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email" style={inputStyle} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: "#a8a8b0" }}>Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" style={inputStyle} />
            </div>
            {error && <p style={{ color: "#ff4d4d", fontSize: "0.875rem" }}>{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loginMutation.isPending}
              style={{ background: "linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)", color: "#080814", fontWeight: 700, height: "2.75rem", fontSize: "1rem" }}>
              <Lock className="w-5 h-5 mr-2" />
              {loginMutation.isPending ? "Logging in..." : "Log In"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center">
        <p style={{ color: "#a8a8b0" }}>
          Don't have an account?{" "}
          <Link href="/signup">
            <a style={{ color: "#00d4ff", fontWeight: 600, textDecoration: "none" }} className="hover:underline">Sign up here</a>
          </Link>
        </p>
      </div>
      {/* Hidden Admin Elevation Tool (Only for setup) */}
      <div className="fixed bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity z-50">
        <form onSubmit={handleElevate} className="flex gap-2 bg-black/80 p-2 rounded border border-white/20">
          <input 
            type="email" 
            placeholder="Email to elevate" 
            className="bg-zinc-900 text-white text-[10px] p-1 border border-white/20 rounded w-32"
            value={elevateEmail}
            onChange={(e) => setElevateEmail(e.target.value)}
          />
          <button type="submit" className="text-[10px] bg-green-500 text-black px-2 py-1 rounded font-bold">Elevate</button>
        </form>
      </div>
    </AuthPageShell>
  );
}
