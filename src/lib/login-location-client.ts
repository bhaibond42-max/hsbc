import { api } from "@/lib/client";

const PENDING_KEY = "hsbc_pending_login_event";

export function stashPendingLoginEvent(loginEventId: string) {
  try {
    sessionStorage.setItem(PENDING_KEY, loginEventId);
  } catch {
    /* ignore */
  }
}

export async function reportLoginLocation(loginEventId: string) {
  let geoStatus: "granted" | "denied" | "unavailable" | "timeout" | "error" = "unavailable";
  let latitude: number | undefined;
  let longitude: number | undefined;
  let accuracyMeters: number | undefined;
  let locationLabel: string | undefined;

  if (typeof navigator !== "undefined" && navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12_000,
          maximumAge: 0,
        });
      });
      geoStatus = "granted";
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
      accuracyMeters = position.coords.accuracy;
      const parts = [
        latitude.toFixed(5),
        longitude.toFixed(5),
        accuracyMeters ? `±${Math.round(accuracyMeters)}m` : "",
      ].filter(Boolean);
      locationLabel = parts.join(" ");
    } catch (cause) {
      const err = cause as GeolocationPositionError | undefined;
      if (err?.code === 1) geoStatus = "denied";
      else if (err?.code === 3) geoStatus = "timeout";
      else geoStatus = "error";
    }
  }

  await api("/api/auth/login-location", {
    method: "POST",
    body: JSON.stringify({
      loginEventId,
      geoStatus,
      latitude,
      longitude,
      accuracyMeters,
      locationLabel,
    }),
  });
}

export async function flushPendingLoginLocation() {
  let loginEventId: string | null = null;
  try {
    loginEventId = sessionStorage.getItem(PENDING_KEY);
  } catch {
    return;
  }
  if (!loginEventId) return;
  try {
    await reportLoginLocation(loginEventId);
  } catch {
    /* location reporting is best-effort */
  } finally {
    try {
      sessionStorage.removeItem(PENDING_KEY);
    } catch {
      /* ignore */
    }
  }
}

export async function completeLoginWithLocation(loginEventId: string | undefined) {
  if (!loginEventId) return;
  stashPendingLoginEvent(loginEventId);
  try {
    await reportLoginLocation(loginEventId);
    try {
      sessionStorage.removeItem(PENDING_KEY);
    } catch {
      /* ignore */
    }
  } catch {
    /* home page will retry via flushPendingLoginLocation */
  }
}
