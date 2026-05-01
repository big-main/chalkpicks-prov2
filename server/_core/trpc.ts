import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// Premium procedure: requires active subscription (daily, monthly, or yearly)
export const premiumProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Login required" });
    }

    const isActive = ctx.user.subscriptionTier !== 'free' && (
      !ctx.user.subscriptionExpiresAt || ctx.user.subscriptionExpiresAt > new Date()
    );

    if (!isActive) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Premium subscription required. Upgrade to access this feature.",
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// Pro procedure: requires monthly or yearly subscription
export const proProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Login required" });
    }

    const isProActive = (ctx.user.subscriptionTier === 'monthly' || ctx.user.subscriptionTier === 'yearly') && (
      !ctx.user.subscriptionExpiresAt || ctx.user.subscriptionExpiresAt > new Date()
    );

    if (!isProActive) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Monthly Pro or Annual Elite subscription required. Upgrade to access this feature.",
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
