import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { picksRouter } from "./routers/picks";
import { statsRouter } from "./routers/stats";
import { backtestRouter } from "./routers/backtest";
import { betsRouter } from "./routers/bets";
import { leaderboardRouter } from "./routers/leaderboard";
import { subscriptionRouter } from "./routers/subscription";
import { notificationsRouter } from "./routers/notificationsRouter";
import { feedbackRouter } from "./routers/feedback";
import { paypalRouter } from "./routers/paypal";
import { oddsRouter } from "./routers/odds";
import { aiPicksRouter } from "./routers/aiPicks";
import { promoCodeRouter } from "./routers/promoCode";
import { kalshiRouter } from "./routers/kalshi";
import { clvRouter } from "./routers/clv";
import * as db from "./db";
import type { User } from "../drizzle/schema";
import type { Response, Request } from "express";

function safeUser(user: User) {
  const { passwordHash: _, ...rest } = user;
  return rest;
}

async function issueSessionCookie(req: Request, res: Response, userId: number, name: string) {
  const sessionToken = await sdk.createSessionToken(userId, name, { expiresInMs: ONE_YEAR_MS });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        email: z.string().email(),
        password: z.string().min(8).max(128),
      }))
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
        }

        const passwordHash = await bcrypt.hash(input.password, 12);
        const user = await db.createUser({ name: input.name, email: input.email, passwordHash });

        await issueSessionCookie(ctx.req, ctx.res, user.id, user.name ?? input.name);

        return safeUser(user);
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1).max(1024),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        const invalid = !user || !user.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash));
        if (invalid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        await issueSessionCookie(ctx.req, ctx.res, user!.id, user!.name ?? "");

        return safeUser(user!);
      }),

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
  odds: oddsRouter,
  aiPicks: aiPicksRouter,
  promoCode: promoCodeRouter,
  kalshi: kalshiRouter,
  clv: clvRouter,
});

export type AppRouter = typeof appRouter;
