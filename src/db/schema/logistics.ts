import { sql } from "drizzle-orm";
import {
	bigint,
	boolean,
	check,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	smallint,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth.ts";
import { orders, returnRequests } from "./orders.ts";

// Enums for Domain 4

export const midtransStatusEnum = pgEnum("midtrans_status", [
	"initiated",
	"pending",
	"capture",
	"settlement",
	"deny",
	"cancel",
	"expire",
	"failure",
	"partial_refund",
	"refund",
	"chargeback",
]);

export const refundChannelEnum = pgEnum("refund_channel", [
	"midtrans_online",
	"manual_bank_transfer",
]);

export const refundStatusEnum = pgEnum("refund_status", [
	"requested",
	"processing",
	"confirmed",
	"failed",
]);

export const shipmentDirectionEnum = pgEnum("shipment_direction", [
	"outbound",
	"exchange_outbound",
]);

export const shipmentStatusEnum = pgEnum("shipment_status", [
	"preparing",
	"ready_to_ship",
	"in_transit",
	"out_for_delivery",
	"delivered",
	"returned_to_sender",
]);

// 23. payments Table (Midtrans Snap Payments & Multi-Attempt Records)

export const payments = pgTable(
	"payments",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		orderId: uuid("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "restrict" }),
		midtransOrderId: varchar("midtrans_order_id", { length: 50 }).notNull(),
		midtransTransactionId: varchar("midtrans_transaction_id", { length: 64 }),
		snapToken: varchar("snap_token", { length: 64 }).notNull(),
		snapRedirectUrl: text("snap_redirect_url").notNull(),
		paymentType: varchar("payment_type", { length: 40 }),
		acquiringBank: varchar("acquiring_bank", { length: 40 }),
		vaNumber: varchar("va_number", { length: 50 }),
		grossAmountIdr: bigint("gross_amount_idr", { mode: "number" }).notNull(),
		midtransStatus: midtransStatusEnum("midtrans_status")
			.default("initiated")
			.notNull(),
		fraudStatus: varchar("fraud_status", { length: 20 }),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		settledAt: timestamp("settled_at", { withTimezone: true }),
		rawResponse: jsonb("raw_response"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("payments_midtrans_order_id_uq").on(t.midtransOrderId),
		uniqueIndex("payments_midtrans_tx_id_uq")
			.on(t.midtransTransactionId)
			.where(sql`${t.midtransTransactionId} IS NOT NULL`),
		index("payments_order_created_idx").on(t.orderId, t.createdAt.desc()),
		uniqueIndex("payments_single_settled_per_order_uq")
			.on(t.orderId)
			.where(sql`${t.midtransStatus} IN ('capture', 'settlement')`),
	],
);

// 24. payment_webhook_logs Table (SHA-512 Signed Webhook Audit)

export const paymentWebhookLogs = pgTable(
	"payment_webhook_logs",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		paymentId: uuid("payment_id").references(() => payments.id, {
			onDelete: "set null",
		}),
		idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
		midtransOrderId: varchar("midtrans_order_id", { length: 50 }).notNull(),
		transactionStatus: varchar("transaction_status", { length: 30 }).notNull(),
		statusCode: varchar("status_code", { length: 10 }).notNull(),
		signatureValid: boolean("signature_valid").notNull(),
		httpStatusReturned: smallint("http_status_returned").notNull(),
		payload: jsonb("payload").notNull(),
		receivedAt: timestamp("received_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("payment_webhook_logs_idempotency_uq").on(t.idempotencyKey),
		index("payment_webhook_logs_order_received_idx").on(
			t.midtransOrderId,
			t.receivedAt.desc(),
		),
	],
);

// 25. payment_refunds Table (Midtrans Online & Manual Bank Refund Tracking)

export const paymentRefunds = pgTable(
	"payment_refunds",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		paymentId: uuid("payment_id")
			.notNull()
			.references(() => payments.id, { onDelete: "restrict" }),
		returnRequestId: uuid("return_request_id").references(
			() => returnRequests.id,
			{ onDelete: "set null" },
		),
		refundKey: varchar("refund_key", { length: 64 }).notNull(),
		refundChannel: refundChannelEnum("refund_channel").notNull(),
		amountIdr: bigint("amount_idr", { mode: "number" }).notNull(),
		reason: varchar("reason", { length: 255 }).notNull(),
		status: refundStatusEnum("status").default("requested").notNull(),
		midtransRefundId: varchar("midtrans_refund_id", { length: 64 }),
		bankConfirmedAt: timestamp("bank_confirmed_at", { withTimezone: true }),
		manualBankInfo: jsonb("manual_bank_info"),
		initiatedBy: uuid("initiated_by").references(() => users.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("payment_refunds_refund_key_uq").on(t.refundKey),
		index("payment_refunds_payment_id_idx").on(t.paymentId),
		check("payment_refunds_amount_positive", sql`${t.amountIdr} > 0`),
	],
);

// 26. shipments Table (RajaOngkir Multi-Carrier & AWB Tracking)

export const shipments = pgTable(
	"shipments",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		orderId: uuid("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "restrict" }),
		returnRequestId: uuid("return_request_id").references(
			() => returnRequests.id,
			{ onDelete: "set null" },
		),
		direction: shipmentDirectionEnum("direction").default("outbound").notNull(),
		originSubdistrictId: integer("origin_subdistrict_id").notNull(),
		destinationSubdistrictId: integer("destination_subdistrict_id").notNull(),
		courierCode: varchar("courier_code", { length: 20 }).notNull(),
		courierService: varchar("courier_service", { length: 50 }).notNull(),
		etd: varchar("etd", { length: 30 }),
		actualWeightGrams: integer("actual_weight_grams").notNull(),
		volumetricWeightGrams: integer("volumetric_weight_grams").notNull(),
		chargeableWeightGrams: integer("chargeable_weight_grams").notNull(),
		shippingCostIdr: bigint("shipping_cost_idr", { mode: "number" }).notNull(),
		awbNumber: varchar("awb_number", { length: 64 }),
		shipmentStatus: shipmentStatusEnum("shipment_status")
			.default("preparing")
			.notNull(),
		trackingManifest: jsonb("tracking_manifest"),
		lastTrackedAt: timestamp("last_tracked_at", { withTimezone: true }),
		shippedAt: timestamp("shipped_at", { withTimezone: true }),
		deliveredAt: timestamp("delivered_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		index("shipments_order_id_idx").on(t.orderId),
		index("shipments_awb_number_idx").on(t.awbNumber),
		index("shipments_status_tracking_idx").on(
			t.shipmentStatus,
			t.lastTrackedAt,
		),
	],
);

// 27. shipping_rate_cache Table (High-Speed RajaOngkir Rate Cache)

export const shippingRateCache = pgTable(
	"shipping_rate_cache",
	{
		cacheKey: varchar("cache_key", { length: 128 }).primaryKey(),
		ratesPayload: jsonb("rates_payload").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [index("shipping_rate_cache_expires_idx").on(t.expiresAt)],
);
