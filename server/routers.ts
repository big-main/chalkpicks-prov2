import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { picksRouter } from "./routers/picks";
import { statsRouter } from "./routers/stats";
import { backtestRouter } from "./routers/backtest";
import { betsRouter } from "./routers/bets";
import { leaderboardRouter } from "./routers/leaderboard";
import { subscriptionRouter } from "./routers/subscription";
import { notificationsRouter } from "./routers/notifications";
import { feedbackRouter } from "./routers/feedback";
import { paypalRouter } from "./routers/paypal";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  picks: picksRouter,
  stats: statsRouter,
  backtest: backtestRouter,
  bets: betsRouter,
  leaderboard: leaderboardRouter,
  subscription: subscriptionRouter,
  notifications: notificationsRouter,
  feedback: feedbackRouter,
  paypal: paypalRouter,
});

export type AppRouter = typeof appRouter;
