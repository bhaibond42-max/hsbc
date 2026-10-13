import { prisma } from "@/lib/db";
import { json, notFound, route } from "@/lib/http";
import { assertUserCanMutate } from "@/lib/user-access";
import { requireUserApi } from "@/server/auth";

export const DELETE = route<{ id: string }>(async (_req, params) => {
  const current = await requireUserApi();
  assertUserCanMutate();
  const item = await prisma.scheduledPayment.findFirst({ where: { id: params.id, userId: current.user.id } });
  if (!item) throw notFound("Scheduled payment not found");
  await prisma.scheduledPayment.update({ where: { id: item.id }, data: { active: false } });
  return json({ ok: true });
});
