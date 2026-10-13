import { prisma } from "@/lib/db";
import { json, route } from "@/lib/http";
import { requireUserApi } from "@/server/auth";
import { serializeNotification } from "@/server/serialize";

export const GET = route(async () => {
  const current = await requireUserApi();
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: current.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notification.count({ where: { userId: current.user.id, read: false } }),
  ]);
  return json({ notifications: items.map(serializeNotification), unread });
});
