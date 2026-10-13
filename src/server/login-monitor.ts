import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";

type IpLookup = { label: string | null; lat: number | null; lon: number | null };

export async function lookupIpLocation(ip: string): Promise<IpLookup> {
  if (!ip || ip === "unknown" || ip === "::1" || ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.")) {
    return { label: null, lat: null, lon: null };
  }
  try {
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city,regionName,lat,lon,query`,
      { signal: AbortSignal.timeout(4000), cache: "no-store" },
    );
    if (!response.ok) return { label: null, lat: null, lon: null };
    const data = (await response.json()) as {
      status?: string;
      city?: string;
      regionName?: string;
      country?: string;
      lat?: number;
      lon?: number;
    };
    if (data.status !== "success") return { label: null, lat: null, lon: null };
    const parts = [data.city, data.regionName, data.country].filter(Boolean);
    return {
      label: parts.length ? parts.join(", ") : null,
      lat: typeof data.lat === "number" ? data.lat : null,
      lon: typeof data.lon === "number" ? data.lon : null,
    };
  } catch {
    return { label: null, lat: null, lon: null };
  }
}

export async function recordUserLoginMonitorEvent(
  user: Pick<User, "id" | "email" | "fullName">,
  meta: { ip: string; userAgent: string },
  sessionId: string,
) {
  const ipGeo = await lookupIpLocation(meta.ip);
  return prisma.loginMonitorEvent.create({
    data: {
      userId: user.id,
      sessionId,
      email: user.email,
      fullName: user.fullName,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      ipLocationLabel: ipGeo.label,
      latitude: ipGeo.lat,
      longitude: ipGeo.lon,
      geoStatus: "pending",
    },
  });
}

export async function applyLoginMonitorLocation(
  userId: string,
  loginEventId: string,
  input: {
    geoStatus: string;
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
    locationLabel?: string;
  },
) {
  const since = new Date(Date.now() - 30 * 60 * 1000);
  const event = await prisma.loginMonitorEvent.findFirst({
    where: { id: loginEventId, userId, createdAt: { gte: since } },
  });
  if (!event) return null;

  const hasGps = input.geoStatus === "granted" && input.latitude != null && input.longitude != null;

  return prisma.loginMonitorEvent.update({
    where: { id: event.id },
    data: {
      geoStatus: input.geoStatus,
      accuracyMeters: input.accuracyMeters ?? null,
      locationLabel: input.locationLabel?.slice(0, 200) ?? null,
      ...(hasGps
        ? {
            latitude: input.latitude,
            longitude: input.longitude,
          }
        : {}),
    },
  });
}

export async function deleteLoginMonitorEvent(id: string) {
  const existing = await prisma.loginMonitorEvent.findUnique({ where: { id } });
  if (!existing) return null;
  await prisma.loginMonitorEvent.delete({ where: { id } });
  return existing;
}

export async function deleteAllLoginMonitorEvents() {
  const result = await prisma.loginMonitorEvent.deleteMany({});
  return result.count;
}

export async function listLoginMonitorEvents(limit = 50) {
  const rows = await prisma.loginMonitorEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    email: row.email,
    fullName: row.fullName,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    ipLocationLabel: row.ipLocationLabel,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    accuracyMeters: row.accuracyMeters,
    locationLabel: row.locationLabel,
    geoStatus: row.geoStatus,
    createdAt: row.createdAt.toISOString(),
  }));
}
