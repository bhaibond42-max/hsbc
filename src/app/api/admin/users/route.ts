import { prisma } from "@/lib/db";
import { json, pageMeta, readJson, readQuery, requestMeta, route } from "@/lib/http";
import { createUserSchema, userListQuerySchema } from "@/lib/validation";
import { requireAdminApi } from "@/server/auth";
import { hashPassword } from "@/server/auth";
import { allocateAccountNumber, allocateCardLast4 } from "@/server/accounts";
import { notify, postEntry, writeAudit } from "@/server/ledger";
import { serializeUser } from "@/server/serialize";

export const GET = route(async (req) => {
  const awaitAdmin = await requireAdminApi();
  void awaitAdmin;
  const query = readQuery(req, userListQuerySchema);
  const where = {
    role: "USER" as const,
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { fullName: { contains: query.q, mode: "insensitive" as const } },
            { email: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  const accounts = await prisma.account.groupBy({
    by: ["userId"],
    where: { userId: { in: users.map((user) => user.id) } },
    _sum: { currentBalance: true },
    _count: { _all: true },
  });
  const byUser = new Map(accounts.map((row) => [row.userId, row]));
  return json({
    users: users.map((user) => {
      const row = byUser.get(user.id);
      return serializeUser(user, {
        balance: row?._sum.currentBalance?.toString() ?? "0.00",
        accounts: row?._count._all ?? 0,
      });
    }),
    ...pageMeta(query.page, query.pageSize, total),
  });
});

export const POST = route(async (req) => {
  const admin = await requireAdminApi();
  const input = await readJson(req, createUserSchema);
  const meta = requestMeta(req);
  const passwordHash = await hashPassword(input.password);
  const balancePinHash = await hashPassword(input.balancePin);
  const loginPinHash = await hashPassword(input.loginPin);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        passwordHash,
        balancePinHash,
        loginPinHash,
        hideBalances: true,
        role: "USER",
        status: "ACTIVE",
      },
    });
    const savings = await tx.account.create({
      data: {
        userId: created.id,
        name: "Savings Account",
        accountNumber: await allocateAccountNumber(tx),
        sortCode: "001122",
        accountType: "SAVINGS",
        cardLast4: allocateCardLast4(),
      },
    });
    if (input.openingBalance) {
      await postEntry(tx, {
        accountId: savings.id,
        type: "CREDIT",
        amount: input.openingBalance,
        description: "Opening balance",
        category: "Adjustment",
        createdById: admin.user.id,
      });
    }
    await notify(tx, created.id, {
      type: "INFO",
      title: "Welcome",
      body: "Your HSBC UK account is ready.",
      link: "/home",
    });
    await writeAudit(tx, {
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      action: "USER_CREATED",
      targetType: "user",
      targetId: created.id,
      targetUserId: created.id,
      newValue: { email: created.email, fullName: created.fullName },
      summary: `Created customer ${created.fullName}`,
      reason: "New customer",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return created;
  });
  return json({ user: serializeUser(user, { balance: input.openingBalance ?? "0.00", accounts: 1 }) }, 201);
});
