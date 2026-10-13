import { prisma } from "@/lib/db";
import { json, notFound, readJson, requestMeta, route } from "@/lib/http";
import { adminDeleteNotificationSchema } from "@/lib/validation";
import { requireAdminApi } from "@/server/auth";
import { writeAudit } from "@/server/ledger";

export const DELETE = route<{ id: string }>(async (req, params) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, adminDeleteNotificationSchema);
  const meta = requestMeta(req);

  const existing = await prisma.notification.findUnique({
    where: { id: params.id },
    include: { user: { select: { id: true, fullName: true, role: true } } },
  });
  if (!existing) throw notFound("Notification not found");
  if (existing.user.role !== "USER") throw notFound("Notification not found");

  await prisma.$transaction(async (tx) => {
    await tx.notification.delete({ where: { id: existing.id } });
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: "NOTIFICATION_SENT",
      targetType: "notification",
      targetId: existing.id,
      targetUserId: existing.userId,
      oldValue: { title: existing.title, type: existing.type },
      newValue: { deleted: true },
      reason: input.reason ?? "Notification removed by staff",
      summary: `Deleted notification for ${existing.user.fullName}: ${existing.title}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  });

  return json({ ok: true });
});
