import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onDuplicateKeyUpdate: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
}));

// ─── Mock notification service ────────────────────────────────────────────────
vi.mock("./notificationService", () => ({
  ensureUserPreferences: vi.fn().mockResolvedValue(undefined),
  getUserInAppNotifications: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      type: "daily_picks",
      title: "Today's Picks Are Ready",
      message: "5 new picks available",
      isRead: false,
      createdAt: new Date(),
    },
    {
      id: 2,
      userId: 1,
      type: "system",
      title: "Welcome to ChalkPicks Pro",
      message: "Your account is set up",
      isRead: true,
      createdAt: new Date(),
    },
  ]),
  getUserNotificationHistory: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      channel: "email",
      type: "daily_picks",
      recipient: "user@example.com",
      subject: "Today's Picks Are Ready",
      status: "sent",
      sentAt: new Date(),
      createdAt: new Date(),
    },
  ]),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  sendLoginAlert: vi.fn().mockResolvedValue(undefined),
  sendSubscriptionConfirmation: vi.fn().mockResolvedValue(undefined),
  sendDailyPicksToAllUsers: vi.fn().mockResolvedValue(undefined),
  sendDailyDigestToAllUsers: vi.fn().mockResolvedValue(undefined),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@chalkpicks.ml",
      name: "Test User",
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createCaller() {
  return appRouter.createCaller(createAuthContext());
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Notification System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── In-App Notifications ──────────────────────────────────────────────────
  describe("notifications.getInApp", () => {
    it("returns in-app notifications for authenticated user", async () => {
      const caller = createCaller();
      const result = await caller.notifications.getInApp();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("returns notifications with required fields", async () => {
      const caller = createCaller();
      const result = await caller.notifications.getInApp();
      const notif = result[0];
      expect(notif).toHaveProperty("id");
      expect(notif).toHaveProperty("title");
      expect(notif).toHaveProperty("message");
      expect(notif).toHaveProperty("isRead");
      expect(notif).toHaveProperty("type");
    });
  });

  // ── Unread Count ──────────────────────────────────────────────────────────
  describe("notifications.getUnreadCount", () => {
    it("returns unread count object with count property", async () => {
      const caller = createCaller();
      const result = await caller.notifications.getUnreadCount();
      // Returns { count: number } — value may be 0 or undefined in test env
      expect(result).toHaveProperty("count");
    });
  });

  // ── Mark Read ─────────────────────────────────────────────────────────────
  describe("notifications.markRead", () => {
    it("marks a notification as read", async () => {
      const caller = createCaller();
      const result = await caller.notifications.markRead({ notificationId: 1 });
      expect(result).toEqual({ success: true });
    });
  });

  // ── Mark All Read ─────────────────────────────────────────────────────────
  describe("notifications.markAllRead", () => {
    it("marks all notifications as read", async () => {
      const caller = createCaller();
      const result = await caller.notifications.markAllRead();
      expect(result).toEqual({ success: true });
    });
  });

  // ── Notification History ──────────────────────────────────────────────────
  describe("notifications.getHistory", () => {
    it("returns notification history for user", async () => {
      const caller = createCaller();
      const result = await caller.notifications.getHistory();
      expect(Array.isArray(result)).toBe(true);
    });

    it("history entries have required fields", async () => {
      const caller = createCaller();
      const result = await caller.notifications.getHistory();
      if (result.length > 0) {
        const log = result[0];
        expect(log).toHaveProperty("channel");
        expect(log).toHaveProperty("type");
        expect(log).toHaveProperty("status");
      }
    });
  });

  // ── Preferences ───────────────────────────────────────────────────────────
  describe("notifications.getPreferences", () => {
    it("returns null or preferences object", async () => {
      const caller = createCaller();
      const result = await caller.notifications.getPreferences();
      // Can be null if no prefs set yet
      expect(result === null || typeof result === "object").toBe(true);
    });
  });

  describe("notifications.updatePreferences", () => {
    it("updates email preferences successfully", async () => {
      const caller = createCaller();
      const result = await caller.notifications.updatePreferences({
        emailEnabled: true,
        emailDailyPicks: true,
        emailDailyDigest: false,
        emailLoginAlert: true,
      });
      expect(result).toEqual({ success: true });
    });

    it("updates SMS preferences with phone number", async () => {
      const caller = createCaller();
      const result = await caller.notifications.updatePreferences({
        smsEnabled: true,
        smsPhone: "+15550001234",
        smsDailyPicks: true,
      });
      expect(result).toEqual({ success: true });
    });

    it("updates in-app preferences", async () => {
      const caller = createCaller();
      const result = await caller.notifications.updatePreferences({
        inAppEnabled: true,
        inAppDailyPicks: true,
        inAppPerformance: false,
      });
      expect(result).toEqual({ success: true });
    });
  });

  // ── Test Notification ─────────────────────────────────────────────────────
  describe("notifications.sendTest", () => {
    it("sends in-app test notification", async () => {
      const caller = createCaller();
      const result = await caller.notifications.sendTest({ type: "in_app" });
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
    });

    it("returns message for email test without API key", async () => {
      const caller = createCaller();
      const result = await caller.notifications.sendTest({ type: "email" });
      expect(result.success).toBe(false);
      expect(result.message).toContain("SendGrid");
    });
  });

  // ── Scheduled Daily Picks (public endpoint) ───────────────────────────────
  describe("notifications.scheduledDailyPicks", () => {
    it("rejects unauthorized requests", async () => {
      const caller = createCaller();
      const result = await caller.notifications.scheduledDailyPicks({ secret: "wrong-secret" });
      expect(result.success).toBe(false);
      expect(result.message).toBe("Unauthorized");
    });

    it("accepts correct scheduler secret", async () => {
      const caller = createCaller();
      const result = await caller.notifications.scheduledDailyPicks({
        secret: "chalkpicks-scheduler-2024",
      });
      expect(result.success).toBe(true);
    });
  });
});
