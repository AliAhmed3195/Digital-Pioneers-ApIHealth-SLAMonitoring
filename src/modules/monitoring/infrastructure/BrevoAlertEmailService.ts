import type { MonitorResult } from "@/modules/monitoring/domain/MonitorContracts";

export async function sendBrevoAlertEmailIfNeeded(input: {
  monitorResult: MonitorResult;
  windowFrom: string;
  windowTo: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const criticalOrWarning = input.monitorResult.alerts.filter(
    (alert) => alert.severity === "critical" || alert.severity === "warning"
  );
  if (criticalOrWarning.length === 0) {
    return { sent: false, reason: "No warning/critical alerts in current run." };
  }

  const apiKey = process.env.BREVO_API_KEY;
  const toEmail = process.env.ALERT_TO_EMAIL;
  const fromEmail = process.env.ALERT_FROM_EMAIL;
  if (!apiKey || !toEmail || !fromEmail) {
    return { sent: false, reason: "Brevo environment variables are missing." };
  }

  const lines = criticalOrWarning
    .map((alert) => `- [${alert.severity.toUpperCase()}] ${alert.endpoint}: ${alert.message}`)
    .join("\n");
  const htmlItems = criticalOrWarning
    .map((alert) => `<li><strong>${alert.severity.toUpperCase()}</strong> - ${alert.endpoint}: ${alert.message}</li>`)
    .join("");

  const subject = `[SLA Monitor] ${criticalOrWarning.length} alert(s) detected`;
  const textContent = [
    `Monitoring window: ${input.windowFrom} -> ${input.windowTo}`,
    "",
    input.monitorResult.incident_summary,
    "",
    "Alerts:",
    lines
  ].join("\n");
  const htmlContent = `<p><strong>Monitoring window:</strong> ${input.windowFrom} -> ${input.windowTo}</p>
<p>${input.monitorResult.incident_summary}</p>
<ul>${htmlItems}</ul>`;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: "Digital Pioneer Monitor" },
      to: [{ email: toEmail }],
      subject,
      textContent,
      htmlContent
    })
  });

  if (!response.ok) {
    return { sent: false, reason: `Brevo API failed with status ${response.status}.` };
  }
  return { sent: true };
}
