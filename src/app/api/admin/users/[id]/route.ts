import { prisma } from "@/lib/db";
import { badRequest, json, notFound, readJson, requestMeta, route } from "@/lib/http";
import { fromPence, toPence } from "@/lib/money";
import { updateUserSchema } from "@/lib/validation";
import { hashPassword, requireAdminApi } from "@/server/auth";
import { queryTransactions } from "@/server/queries";
import { writeAudit } from "@/server/ledger";
import { serializeAccount, serializeTxn, serializeUser } from "@/server/serialize";

export const GET = route<{ id: string }>(async (_req, params) => {
  await requireAdminApi();
  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user || user.role !== "USER") throw notFound("Customer not found");
  const accounts = await prisma.account.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  const txns = await queryTransactions({ userId: user.id, page: 1, pageSize: 12 });
  const actions = await prisma.adminAction.findMany({
    where: { targetUserId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { admin: { select: { fullName: true } } },
  });
  const balance = fromPence(accounts.reduce((sum, account) => sum + toPence(account.currentBalance.toString()), 0n));
  return json({
    user: { ...serializeUser(user, { balance, accounts: accounts.length }), hasLoginPin: Boolean(user.loginPinHash) },
    accounts: accounts.map((account) => serializeAccount(account, true)),
    transactions: txns.items.map(serializeTxn),
    actions: actions.map((action) => ({
      id: action.id,
      action: action.action,
      summary: action.summary,
      adminName: action.admin.fullName,
      createdAt: action.createdAt.toISOString(),
    })),
  });
});

export const PATCH = route<{ id: string }>(async (req, params) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, updateUserSchema);
  const meta = requestMeta(req);
  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing || existing.role !== "USER") throw notFound("Customer not found");
  const balancePinHash = input.balancePin ? await hashPassword(input.balancePin) : undefined;
  const updated = await prisma.$transaction(async (tx) => {
    const dateOfBirth = input.dateOfBirth ? new Date(`${input.dateOfBirth}T00:00:00.000Z`) : undefined;
    const next = await tx.user.update({
      where: { id: existing.id },
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone || null,
        addressLine: input.addressLine ?? null,
        city: input.city ?? null,
        postcode: input.postcode ?? null,
        occupation: input.occupation ?? null,
        ...(dateOfBirth !== undefined ? { dateOfBirth } : {}),
        nationality: input.nationality ?? null,
        maritalStatus: input.maritalStatus ?? null,
        employerName: input.employerName ?? null,
        jobTitle: input.jobTitle ?? null,
        workEmail: input.workEmail ?? null,
        workPhone: input.workPhone ?? null,
        workAddressLine: input.workAddressLine ?? null,
        workCity: input.workCity ?? null,
        workPostcode: input.workPostcode ?? null,
        employmentStatus: input.employmentStatus ?? null,
        ...(input.onlinePaymentLimit !== undefined
          ? { onlinePaymentLimit: input.onlinePaymentLimit }
          : {}),
        ...(balancePinHash ? { balancePinHash, hideBalances: true } : {}),
      },
    });
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: "USER_UPDATED",
      targetType: "user",
      targetId: existing.id,
      targetUserId: existing.id,
      oldValue: { fullName: existing.fullName, email: existing.email, phone: existing.phone },
      newValue: { fullName: next.fullName, email: next.email, phone: next.phone },
      reason: input.reason,
      summary: `Updated customer ${next.fullName}`,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return next;
  });
  return json({ user: serializeUser(updated) });
});

export const DELETE = route<{ id: string }>(async (req, params) => {
  const admin = await requireAdminApi();
  const meta = requestMeta(req);
  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing || existing.role !== "USER") throw notFound("Customer not found");
  if (existing.id === admin.user.id) throw badRequest("You cannot delete your own account");
  await prisma.$transaction(async (tx) => {
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: "USER_DELETED",
      targetType: "user",
      targetId: existing.id,
      oldValue: { email: existing.email, fullName: existing.fullName },
      summary: `Deleted customer ${existing.fullName}`,
      reason: "Customer removed",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    await tx.user.delete({ where: { id: existing.id } });
  });
  return json({ ok: true });
});
