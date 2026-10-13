import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { json, pageMeta, readQuery, route } from "@/lib/http";
import { auditQuerySchema } from "@/lib/validation";
import { requireAdminApi } from "@/server/auth";

export const GET = route(async (req) => {
  await requireAdminApi();
  const query = readQuery(req, auditQuerySchema);
  const where: Prisma.AuditLogWhereInput = {
    ...(query.action ? { action: query.action } : {}),
    ...(query.q
      ? {
          OR: [
            { actorEmail: { contains: query.q, mode: "insensitive" } },
            { reason: { contains: query.q, mode: "insensitive" } },
            { targetId: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);
  return json({
    logs: logs.map((log) => ({
      id: log.id,
      createdAt: log.createdAt.toISOString(),
      actorEmail: log.actorEmail,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      oldValue: log.oldValue,
      newValue: log.newValue,
      reason: log.reason,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
    })),
    ...pageMeta(query.page, query.pageSize, total),
  });
});
