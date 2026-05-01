import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Picks from "./pages/Picks";
import PickDetail from "./pages/PickDetail";
import Stats from "./pages/Stats";
import Backtesting from "./pages/Backtesting";
import UserDashboard from "./pages/UserDashboard";
import Leaderboard from "./pages/Leaderboard";
import Pricing from "./pages/Pricing";
import PayPalPricing from "./pages/PayPalPricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import MatchupAnalysis from "./pages/MatchupAnalysis";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import FeedbackAnalytics from "./pages/FeedbackAnalytics";
import Notifications from "@/pages/Notifications";
import EVFinder from "@/pages/EVFinder";
import Tools from "@/pages/Tools";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/picks" component={Picks} />
      <Route path="/picks/:id" component={PickDetail} />
      <Route path="/stats" component={Stats} />
      <Route path="/backtesting" component={Backtesting} />
      <Route path="/dashboard" component={UserDashboard} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/pricing-paypal" component={PayPalPricing} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/matchup-analysis" component={MatchupAnalysis} />
      <Route path="/subscription-management" component={SubscriptionManagement} />
      <Route path="/feedback-analytics" component={FeedbackAnalytics} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/ev-finder" component={EVFinder} />
      <Route path="/tools" component={Tools} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
