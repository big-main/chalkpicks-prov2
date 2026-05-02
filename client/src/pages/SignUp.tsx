import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AuthPageShell from "@/components/AuthPageShell";
import { Zap, Shield, TrendingUp } from "lucide-react";

const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,212,255,0.2)", color: "white" };

const features = [
  { icon: TrendingUp, text: "AI picks with confidence scores" },
  { icon: Shield, text: "Real-time odds from 10+ sportsbooks" },
  { icon: Zap, text: "Advanced tools: Kelly Criterion, +EV Finder" },
];

export default function SignUp() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) setLocation("/");
  }, [isAuthenticated, setLocation]);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/");
    },
    onError: (err) => setError(err.message || "Registration failed. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email || !password) { setError("All fields are required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    registerMutation.mutate({ name: name.trim(), email, password });
  };

  return (
    <AuthPageShell rightLink={{ href: "/login", label: "Log In", variant: "outline" }}>
      <div className="text-center mb-8">
        <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "2.5rem", textTransform: "uppercase", color: "white", lineHeight: 1.2 }}>
          Join the{" "}
          <span style={{ background: "linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Future
          </span>
        </h1>
        <p style={{ color: "#a8a8b0", fontSize: "1rem", marginTop: "1rem" }}>
          Get AI-powered sports betting picks with real-time odds and advanced analytics
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3">
            <f.icon className="w-5 h-5" style={{ color: "#00d4ff" }} />
            <span style={{ color: "#e8e8f0" }}>{f.text}</span>
          </div>
        ))}
      </div>

      <Card style={{ background: "rgba(20,20,30,0.8)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: "8px", marginBottom: "2rem" }}>
        <CardHeader>
          <CardTitle style={{ color: "white", fontSize: "1.5rem" }}>Create Your Account</CardTitle>
          <CardDescription style={{ color: "#a8a8b0" }}>Sign up in seconds — no credit card required</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" style={{ color: "#a8a8b0" }}>Name</Label>
              <Input id="name" type="text" placeholder="Your name" value={name}
                onChange={(e) => setName(e.target.value)} autoComplete="name" style={inputStyle} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: "#a8a8b0" }}>Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email" style={inputStyle} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: "#a8a8b0" }}>Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 characters" value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" style={inputStyle} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" style={{ color: "#a8a8b0" }}>Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Repeat your password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" style={inputStyle} />
            </div>
            {error && <p style={{ color: "#ff4d4d", fontSize: "0.875rem" }}>{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={registerMutation.isPending}
              style={{ background: "linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)", color: "#080814", fontWeight: 700, height: "2.75rem", fontSize: "1rem" }}>
              {registerMutation.isPending ? "Creating account..." : "Create Account"}
            </Button>
            <p style={{ color: "#666", fontSize: "0.75rem", textAlign: "center" }}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>
        </CardContent>
      </Card>

      <div className="text-center">
        <p style={{ color: "#a8a8b0" }}>
          Already have an account?{" "}
          <Link href="/login">
            <a style={{ color: "#00d4ff", fontWeight: 600, textDecoration: "none" }} className="hover:underline">Log in here</a>
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
