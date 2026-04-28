const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { refreshAllUsers } = await import("./lib/snapshots");

    setInterval(async () => {
      try {
        await refreshAllUsers();
      } catch (e) {
        console.error("[snapshot-cron] Error:", e);
      }
    }, THREE_HOURS_MS);

    console.log("[snapshot-cron] Scheduled every 3 hours");
  }
}
