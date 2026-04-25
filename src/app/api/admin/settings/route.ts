import {
  getAppSettings,
  updateAppSettings
} from "@/modules/settings/application/AppSettingsStore";

type AdminSettingsPayload = {
  environment?: "DEMO" | "PROD_SIM";
  piiMaskingEnabled?: boolean;
};

export async function GET(): Promise<Response> {
  return Response.json({ settings: getAppSettings() });
}

export async function PUT(request: Request): Promise<Response> {
  const payload = (await request.json()) as AdminSettingsPayload;
  const settings = updateAppSettings({
    environment: payload.environment,
    piiMaskingEnabled: payload.piiMaskingEnabled
  });
  return Response.json({ settings });
}
