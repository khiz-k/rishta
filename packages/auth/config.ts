import type { AuthConfig } from "./types";

export const config = {
	enableSignup: true,
	enableMagicLink: true,
	enableSocialLogin: true,
	enablePasskeys: true,
	enablePasswordLogin: true,
	enableTwoFactor: true,
	sessionCookieMaxAge: 60 * 60 * 24 * 30,
	users: {
		enableOnboarding: true,
	},
	organizations: {
		enable: false,
		hideOrganization: true,
		enableUsersToCreateOrganizations: false,
		requireOrganization: false,
		forbiddenOrganizationSlugs: [],
	},
} as const satisfies AuthConfig;
