import { createAccessControl } from "better-auth/plugins/access";

export type Role =
	| "customer"
	| "warehouse_staff"
	| "cs_staff"
	| "merchandiser"
	| "admin";

export const STAFF_ROLES: readonly Role[] = [
	"admin",
	"warehouse_staff",
	"cs_staff",
	"merchandiser",
] as const;

export function isStaffRole(role?: string | null): boolean {
	if (!role) return false;
	return (STAFF_ROLES as readonly string[]).includes(role);
}

/**
 * Access Control Statements for Noctura Fashion Store.
 * Merges internal admin resources (user, session) with business domain resources.
 * Completely pure — safe for both client and server code.
 */
export const statements = {
	user: [
		"create",
		"list",
		"set-role",
		"ban",
		"impersonate",
		"impersonate-admins",
		"delete",
		"set-password",
		"set-email",
		"set-phone",
		"get",
		"update",
	],
	session: ["list", "revoke", "delete"],
	catalog: ["read", "manage"],
	orders: ["read", "manage_self", "update_shipments"],
	qc: ["manage"],
	rma: ["approve"],
	dsr: ["read"],
	profile: ["manage_self"],
	promotions: ["manage"],
} as const;

export const ac = createAccessControl(statements);

export const roles = {
	customer: ac.newRole({
		catalog: ["read"],
		orders: ["manage_self"],
		profile: ["manage_self"],
	}),
	warehouse_staff: ac.newRole({
		orders: ["read", "update_shipments"],
		qc: ["manage"],
	}),
	cs_staff: ac.newRole({
		orders: ["read"],
		rma: ["approve"],
		dsr: ["read"],
	}),
	merchandiser: ac.newRole({
		catalog: ["read", "manage"],
		promotions: ["manage"],
	}),
	admin: ac.newRole({
		user: [
			"create",
			"list",
			"set-role",
			"ban",
			"impersonate",
			"impersonate-admins",
			"delete",
			"set-password",
			"set-email",
			"set-phone",
			"get",
			"update",
		],
		session: ["list", "revoke", "delete"],
		catalog: ["read", "manage"],
		orders: ["read", "manage_self", "update_shipments"],
		qc: ["manage"],
		rma: ["approve"],
		dsr: ["read"],
		profile: ["manage_self"],
		promotions: ["manage"],
	}),
};
