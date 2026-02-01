import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Apply memory decay daily at midnight UTC
crons.daily(
  "apply-memory-decay",
  { hourUTC: 0, minuteUTC: 0 },
  internal.maintenance.applyMemoryDecay
);

// Cleanup old, decayed memories weekly on Sunday at 2 AM UTC
crons.weekly(
  "cleanup-old-memories",
  { dayOfWeek: "sunday", hourUTC: 2, minuteUTC: 0 },
  internal.maintenance.cleanupOldMemories
);

// Cleanup expired sessions daily at 1 AM UTC
crons.daily(
  "cleanup-expired-sessions",
  { hourUTC: 1, minuteUTC: 0 },
  internal.maintenance.cleanupExpiredSessions
);

export default crons;
