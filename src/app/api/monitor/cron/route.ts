import { runMonitorCycle } from "@/modules/monitoring/application/MonitorService";

function isAuthorized(request: Request): boolean {
  const secrets = [process.env.MONITOR_CRON_SECRET, process.env.CRON_SECRET].filter(
    (item): item is string => Boolean(item)
  );
  if (secrets.length === 0) {
    return true;
  }
  const authHeader = request.headers.get("authorization");
  if (secrets.some((secret) => authHeader === `Bearer ${secret}`)) {
    return true;
  }
  const headerSecret = request.headers.get("x-monitor-secret");
  return secrets.includes(headerSecret ?? "");
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized monitor cron call." }, { status: 401 });
  }

  const result = await runMonitorCycle();
  return Response.json({
    message: "Monitor cycle executed.",
    run: result.run,
    email: result.email
  });
}
