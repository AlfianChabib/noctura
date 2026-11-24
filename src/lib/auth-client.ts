import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, roles } from "./auth";

export const authClient = createAuthClient({
	plugins: [
		adminClient({
			ac,
			roles,
		}),
	],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

export type AuthClient = typeof authClient;
