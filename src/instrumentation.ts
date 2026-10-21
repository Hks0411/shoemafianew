export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.IMPORT_WORKER !== "0") {
      const { startImportWorker } = await import("@/lib/import/process");
      startImportWorker();
    }
    try {
      const { ensureBootstrapAdmin, ensureStoreBootstrap } = await import("@/lib/auth/bootstrap");
      await ensureStoreBootstrap();
      await ensureBootstrapAdmin();
    } catch (error) {
      console.warn("Admin bootstrap skipped:", error instanceof Error ? error.message : error);
    }
  }
}
