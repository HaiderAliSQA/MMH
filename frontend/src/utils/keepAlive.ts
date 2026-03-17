const BACKEND_URL = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'
).replace('/api', '');

let pingInterval: ReturnType<typeof setInterval> | null = null;

const pingServer = async (): Promise<void> => {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      cache: 'no-cache',
    });
    if (res.ok) {
      console.log(
        `✅ [MMH] Server alive — ${new Date().toLocaleTimeString()}`
      );
    }
  } catch {
    console.log(
      `⚠️ [MMH] Server sleeping, waking up... — ${new Date().toLocaleTimeString()}`
    );
  }
};

export const startKeepAlive = (): void => {
  // Stop existing interval if any
  if (pingInterval) {
    clearInterval(pingInterval);
  }

  // First ping immediately on app start
  pingServer();

  // Then ping every 50 minutes
  // (Render sleeps after 15 min inactivity,
  //  50 min keeps it alive without too many requests)
  pingInterval = setInterval(pingServer, 50 * 60 * 1000);

  console.log('🏥 [MMH] Keep-alive started (every 50 min)');
};

export const stopKeepAlive = (): void => {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
    console.log('🔴 [MMH] Keep-alive stopped');
  }
};

// Wake up server immediately (call on login page load)
export const wakeUpServer = async (): Promise<void> => {
  console.log('⏳ [MMH] Waking up server...');
  await pingServer();
};
