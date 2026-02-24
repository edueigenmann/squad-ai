export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL as
    | string
    | undefined;
  const appId = import.meta.env.VITE_APP_ID as string | undefined;
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  const redirectUri = `${origin}/api/oauth/callback`;

  if (!oauthPortalUrl || !appId) {
    console.warn(
      "[Auth] Missing VITE_OAUTH_PORTAL_URL or VITE_APP_ID. Login redirect disabled."
    );
    return "/";
  }

  try {
    const state = btoa(redirectUri);
    const url = new URL("/app-auth", oauthPortalUrl);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");
    return url.toString();
  } catch (error) {
    console.warn("[Auth] Invalid OAuth portal URL. Login redirect disabled.", error);
    return "/";
  }
};
