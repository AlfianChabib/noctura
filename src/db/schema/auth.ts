import { sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// Enums for Domain 1

export const consentTypeEnum = pgEnum("consent_type", [
	"privacy_policy",
	"terms",
	"marketing_email",
	"marketing_wa",
]);

export const dsrRequestTypeEnum = pgEnum("dsr_request_type", [
	"access",
	"rectification",
	"erasure",
	"withdraw_consent",
	"restriction",
	"portability",
]);

export const dsrStatusEnum = pgEnum("dsr_status", [
	"submitted",
	"verifying",
	"in_progress",
	"completed",
	"rejected",
]);

// 1. users Table (Better Auth Core + RBAC & Extended Fields)

export const users = pgTable(
	"users",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: text("name").notNull(),
		email: text("email").notNull(),
		emailVerified: boolean("email_verified").default(false).notNull(),
		image: text("image"),
		phone: varchar("phone", { length: 20 }),
		role: text("role").default("customer").notNull(),
		banned: boolean("banned").default(false).notNull(),
		banReason: text("ban_reason"),
		banExpires: timestamp("ban_expires", { withTimezone: true }),
		impersonatedBy: text("impersonated_by"),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("users_email_uq").on(t.email),
		index("users_role_idx").on(t.role),
		index("users_active_idx")
			.on(t.deletedAt)
			.where(sql`${t.deletedAt} IS NULL`),
	],
);

// 2. sessions Table (Better Auth)

export const sessions = pgTable(
	"sessions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		token: text("token").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		ipAddress: varchar("ip_address", { length: 45 }),
		userAgent: text("user_agent"),
		impersonatedBy: text("impersonated_by"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("sessions_token_uq").on(t.token),
		index("sessions_user_expires_idx").on(t.userId, t.expiresAt),
	],
);

// 3. accounts Table (Better Auth OAuth & Credential Providers)

export const accounts = pgTable(
	"accounts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at", {
			withTimezone: true,
		}),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
			withTimezone: true,
		}),
		scope: text("scope"),
		idToken: text("id_token"),
		password: text("password"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("accounts_provider_account_uq").on(t.providerId, t.accountId),
		index("accounts_user_id_idx").on(t.userId),
	],
);

// 4. verifications Table (Better Auth Tokens / OTP)

export const verifications = pgTable(
	"verifications",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		index("verifications_ident_expires_idx").on(t.identifier, t.expiresAt),
	],
);

// 5. user_addresses Table (RajaOngkir Domestic Destinations)

export const userAddresses = pgTable(
	"user_addresses",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		label: varchar("label", { length: 50 }).notNull(),
		recipientName: varchar("recipient_name", { length: 120 }).notNull(),
		recipientPhone: varchar("recipient_phone", { length: 20 }).notNull(),
		addressLine: text("address_line").notNull(),
		rajaongkirSubdistrictId: integer("rajaongkir_subdistrict_id").notNull(),
		rajaongkirDistrictId: integer("rajaongkir_district_id"),
		provinceName: varchar("province_name", { length: 100 }).notNull(),
		cityName: varchar("city_name", { length: 100 }).notNull(),
		districtName: varchar("district_name", { length: 100 }).notNull(),
		subdistrictName: varchar("subdistrict_name", { length: 100 }).notNull(),
		postalCode: varchar("postal_code", { length: 10 }).notNull(),
		pinPointLat: numeric("pin_point_lat", { precision: 10, scale: 7 }),
		pinPointLng: numeric("pin_point_lng", { precision: 10, scale: 7 }),
		isDefault: boolean("is_default").default(false).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		index("user_addresses_user_id_idx").on(t.userId),
		uniqueIndex("user_addresses_user_default_uq")
			.on(t.userId)
			.where(sql`${t.isDefault} = true`),
	],
);

// 6. user_consents Table (UU PDP Pasal 24 Consent Ledger)

export const userConsents = pgTable(
	"user_consents",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		consentType: consentTypeEnum("consent_type").notNull(),
		policyVersion: varchar("policy_version", { length: 20 }).notNull(),
		granted: boolean("granted").notNull(),
		ipAddress: varchar("ip_address", { length: 45 }).notNull(),
		userAgent: text("user_agent").notNull(),
		recordedAt: timestamp("recorded_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		index("user_consents_audit_idx").on(
			t.userId,
			t.consentType,
			t.recordedAt.desc(),
		),
	],
);

// 7. data_subject_requests Table (PP 33/2026 3x24h SLA Privacy Queue)

export const dataSubjectRequests = pgTable(
	"data_subject_requests",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		requestType: dsrRequestTypeEnum("request_type").notNull(),
		status: dsrStatusEnum("status").default("submitted").notNull(),
		deadlineAt: timestamp("deadline_at", { withTimezone: true }).notNull(),
		handledBy: uuid("handled_by").references(() => users.id, {
			onDelete: "set null",
		}),
		resolutionNotes: text("resolution_notes"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
	},
	(t) => [index("dsr_status_deadline_idx").on(t.status, t.deadlineAt.asc())],
);
