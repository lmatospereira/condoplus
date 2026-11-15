export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const [{ prisma }, { ensureMaster }] = await Promise.all([import("@/lib/db"), import("@/lib/bootstrap")]);
  try {
    await ensureMaster(prisma);
  } catch (e) {
    console.error("[bootstrap] falha ao garantir o Admin Master:", e instanceof Error ? e.message : e);
  }
}
