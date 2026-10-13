import { prisma } from "@/lib/db";
import { json, notFound, readJson, route } from "@/lib/http";
import { adminDeleteAuditSchema } from "@/lib/validation";
import { requireAdminApi } from "@/server/auth";

export const DELETE = route<{ id: string }>(async (req, params) => {
  await requireAdminApi();
  await readJson(req, adminDeleteAuditSchema);

  const existing = await prisma.auditLog.findUnique({ where: { id: params.id } });
  if (!existing) throw notFound("Audit entry not found");

  await prisma.auditLog.delete({ where: { id: existing.id } });
  return json({ ok: true });
});
