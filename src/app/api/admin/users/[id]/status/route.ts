import type { AuditAction, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { badRequest, json, notFound, readJson, requestMeta, route } from "@/lib/http";
import { userStatusActionSchema } from "@/lib/validation";
import { requireAdminApi } from "@/server/auth";
import { notify, writeAudit } from "@/server/ledger";
import { serializeUser } from "@/server/serialize";

const nextStatus: Record<string, { status: UserStatus; action: AuditAction; title: string }> = {
  SUSPEND: { status: "SUSPENDED", action: "USER_SUSPENDED", title: "Account suspended" },
  ACTIVATE: { status: "ACTIVE", action: "USER_ACTIVATED", title: "Account active" },
  LOCK: { status: "LOCKED", action: "USER_LOCKED", title: "Account locked" },
  UNLOCK: { status: "ACTIVE", action: "USER_UNLOCKED", title: "Account unlocked" },
};

export const POST = route<{ id: string }>(async (req, params) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, userStatusActionSchema);
  const meta = requestMeta(req);
  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing || existing.role !== "USER") throw notFound("Customer not found");
  const change = nextStatus[input.action];
  if (!change) throw badRequest("Unknown action");
  if (existing.status === change.status && input.action !== "ACTIVATE" && input.action !== "UNLOCK") {
    throw badRequest("The account is already in that state");
  }
  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id: existing.id }, data: { status: change.status } });
    if (change.status !== "ACTIVE") await tx.session.deleteMany({ where: { userId: existing.id } });
    await notify(tx, existing.id, {
      type: "SECURITY",
      title: change.title,
      body: input.reason,
      link: "/profile",
    });
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: change.action,
      targetType: "user",
      targetId: existing.id,
      targetUserId: existing.id,
      oldValue: { status: existing.status },
      newValue: { status: change.status },
      reason: input.reason,
      summary: `${change.title} for ${existing.fullName}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return user;
  });
  return json({ user: serializeUser(updated) });
});
