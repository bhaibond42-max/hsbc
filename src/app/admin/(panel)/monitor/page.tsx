import { requireAdminPage } from "@/server/auth";
import { listLoginMonitorEvents } from "@/server/login-monitor";
import { AdminLoginMonitor } from "@/components/admin-login-monitor";

export const dynamic = "force-dynamic";

export default async function AdminMonitorPage() {
  await requireAdminPage();
  const initial = await listLoginMonitorEvents(80);
  return (
    <div className="rise space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Security</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-charcoal md:text-3xl">Log on monitor</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Track customer log ons in near real time: public IP, estimated region, and GPS when the browser allows it.
        </p>
      </div>
      <AdminLoginMonitor initial={initial} />
    </div>
  );
}
