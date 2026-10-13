import { prisma } from "@/lib/db";
import { json, readJson, requestMeta, route } from "@/lib/http";
import { sendNotificationSchema } from "@/lib/validation";
import { requireAdminApi } from "@/server/auth";
import { writeAudit } from "@/server/ledger";

export const POST = route(async (req) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, sendNotificationSchema);
  const meta = requestMeta(req);
  const users =
    input.target === "ALL"
      ? await prisma.user.findMany({ where: { role: "USER", status: "ACTIVE" }, select: { id: true } })
      : await prisma.user.findMany({ where: { id: input.target, role: "USER" }, select: { id: true } });
  await prisma.$transaction(async (tx) => {
    if (users.length) {
      await tx.notification.createMany({
        data: users.map((user) => ({
          userId: user.id,
          type: input.type,
          title: input.title,
          body: input.body,
        })),
      });
    }
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: "NOTIFICATION_SENT",
      targetType: "notification",
      targetId: input.target === "ALL" ? undefined : input.target,
      targetUserId: input.target === "ALL" ? null : input.target,
      newValue: { title: input.title, recipients: users.length },
      summary: `Sent “${input.title}” to ${users.length} customer${users.length === 1 ? "" : "s"}`,
      reason: input.title,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
  });
  return json({ ok: true, recipients: users.length });
});
