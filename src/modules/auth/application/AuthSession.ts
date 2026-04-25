export const AUTH_COOKIE_NAME = "dp_session";

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin123";
const STATIC_SESSION_TOKEN = "dp-authenticated";

export function getConfiguredUsername(): string {
  return process.env.ADMIN_USERNAME ?? DEFAULT_USERNAME;
}

export function getConfiguredPassword(): string {
  return process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
}

export function createSessionToken(): string {
  return STATIC_SESSION_TOKEN;
}

export function isValidSessionToken(token: string | undefined): boolean {
  return token === STATIC_SESSION_TOKEN;
}

export function validateLoginCredentials(input: {
  username?: string;
  password?: string;
}): boolean {
  return (
    input.username === getConfiguredUsername() && input.password === getConfiguredPassword()
  );
}
