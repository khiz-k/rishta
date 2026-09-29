import { config } from "@config";

/**
 * A link into the app (sign in, begin a page). Without a configured app URL (local
 * development) it falls back to the app's default local port.
 */
export function appUrl(path: "/login" | "/signup" | "/") {
	const base = (config.saasUrl ?? "http://localhost:3000").replace(/\/$/, "");
	return `${base}${path}`;
}
