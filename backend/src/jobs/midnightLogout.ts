import cron from 'node-cron';
import Session from '../models/Session.model';

// ─── Midnight Logout Job ─────────────────────────────────────────────────────
// Runs every day at 12:00 AM Pakistan time.
// Sets ALL currently active sessions to inactive with logoutReason = 'midnight'.
export const startMidnightJob = () => {
  cron.schedule(
    '0 0 * * *',
    async () => {
      console.log(
        `[${new Date().toISOString()}] Midnight job: Logging out all active sessions...`
      );

      try {
        const result = await Session.updateMany(
          { isActive: true },
          {
            isActive:     false,
            loggedOutAt:  new Date(),
            logoutReason: 'midnight',
          }
        );

        console.log(
          `✅ Midnight logout complete. Sessions ended: ${result.modifiedCount}`
        );
      } catch (error) {
        console.error('❌ Midnight job error:', error);
      }
    },
    {
      timezone: 'Asia/Karachi', // Pakistan Standard Time
    }
  );

  console.log('🕛 Midnight logout job scheduled (12:00 AM PKT)');
};

// ─── Old Session Cleanup Job ─────────────────────────────────────────────────
// Runs every day at 1:00 AM Pakistan time.
// Hard-deletes inactive session records older than 7 days to keep the
// collection lean (MongoDB TTL index also helps, but this is belt-and-suspenders).
export const startCleanupJob = () => {
  cron.schedule(
    '0 1 * * *',
    async () => {
      try {
        const sevenDaysAgo = new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        );

        const result = await Session.deleteMany({
          isActive:    false,
          loggedOutAt: { $lt: sevenDaysAgo },
        });

        console.log(
          `[${new Date().toISOString()}] 🗑️ Session cleanup: ${result.deletedCount} old records removed`
        );
      } catch (error) {
        console.error('❌ Cleanup job error:', error);
      }
    },
    {
      timezone: 'Asia/Karachi',
    }
  );

  console.log('🧹 Session cleanup job scheduled (1:00 AM PKT)');
};
