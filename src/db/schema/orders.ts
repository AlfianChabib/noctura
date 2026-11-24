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
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth.ts";
import { products, productVariants } from "./catalog.ts";

// Enums for Domain 3

export const discountTypeEnum = pgEnum("discount_type", [
	"percentage",
	"fixed_amount",
	"free_shipping",
]);

export const orderStatusEnum = pgEnum("order_status", [
	"pending_payment",
	"paid",
	"fraud_review",
	"packing",
	"shipped",
	"delivered",
	"completed",
	"cancelled",
	"returned",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
	"unpaid",
	"paid",
	"expired",
	"failed",
	"partial_refunded",
	"refunded",
]);

export const rmaRequestTypeEnum = pgEnum("rma_request_type", [
	"size_exchange",
	"refund",
]);

export const rmaReasonCodeEnum = pgEnum("rma_reason_code", [
	"size_too_small",
	"size_too_large",
	"defect",
	"wrong_item",
	"other",
]);

export const rmaStatusEnum = pgEnum("rma_status", [
	"requested",
	"approved",
	"rejected",
	"item_shipped_back",
	"qc_passed",
	"qc_failed",
	"exchange_shipped",
	"refunded",
	"completed",
]);

// Types for Domain 3

export type ShippingAddressSnapshot = {
	recipientName: string;
	recipientPhone: string;
	addressLine: string;
	rajaongkirSubdistrictId: number;
	rajaongkirDistrictId?: number;
	provinceName: string;
	cityName: string;
	districtName: string;
	subdistrictName: string;
	postalCode: string;
	pinPointLat?: number | null;
	pinPointLng?: number | null;
};

export type ItemDimensionsSnapshot = {
	lengthCm: number;
	widthCm: number;
	heightCm: number;
};

// 16. carts Table (Supports Guest and Authenticated Shoppers)

export const carts = pgTable(
	"carts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id").references(() => users.id, {
			onDelete: "cascade",
		}),
		guestToken: varchar("guest_token", { length: 64 }),
		expiresAt: timestamp("expires_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("carts_user_uq")
			.on(t.userId)
			.where(sql`${t.userId} IS NOT NULL`),
		uniqueIndex("carts_guest_token_uq")
			.on(t.guestToken)
			.where(sql`${t.guestToken} IS NOT NULL`),
		check(
			"carts_user_or_guest_guard",
			sql`${t.userId} IS NOT NULL OR ${t.guestToken} IS NOT NULL`,
		),
	],
);

// 17. cart_items Table (Unique Items in Cart)

export const cartItems = pgTable(
	"cart_items",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		cartId: uuid("cart_id")
			.notNull()
			.references(() => carts.id, { onDelete: "cascade" }),
		variantId: uuid("variant_id")
			.notNull()
			.references(() => productVariants.id, { onDelete: "cascade" }),
		quantity: integer("quantity").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("cart_items_cart_variant_uq").on(t.cartId, t.variantId),
		check("cart_items_quantity_positive", sql`${t.quantity} > 0`),
	],
);

// 18. wishlists Table (Saved Favorites)

export const wishlists = pgTable(
	"wishlists",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		productId: uuid("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		variantId: uuid("variant_id").references(() => productVariants.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [uniqueIndex("wishlists_user_product_uq").on(t.userId, t.productId)],
);

// 19. vouchers Table (Promotions & Discounts)

export const vouchers = pgTable(
	"vouchers",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		code: varchar("code", { length: 40 }).notNull(),
		discountType: discountTypeEnum("discount_type").notNull(),
		discountValue: bigint("discount_value", { mode: "number" }).notNull(),
		minOrderIdr: bigint("min_order_idr", { mode: "number" })
			.default(0)
			.notNull(),
		maxDiscountIdr: bigint("max_discount_idr", { mode: "number" }),
		usageLimit: integer("usage_limit"),
		usagePerUser: integer("usage_per_user").default(1).notNull(),
		usedCount: integer("used_count").default(0).notNull(),
		startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
		endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
		isActive: boolean("is_active").default(true).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("vouchers_code_uq").on(t.code),
		check(
			"vouchers_usage_limit_guard",
			sql`${t.usedCount} >= 0 AND (${t.usageLimit} IS NULL OR ${t.usedCount} <= ${t.usageLimit})`,
		),
	],
);

// 20. orders Table (10-Year Immutable Tax & Accounting Retention)

export const orders = pgTable(
	"orders",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		orderNumber: varchar("order_number", { length: 32 }).notNull(),
		idempotencyKey: varchar("idempotency_key", { length: 64 }),
		userId: uuid("user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		voucherId: uuid("voucher_id").references(() => vouchers.id, {
			onDelete: "set null",
		}),
		orderStatus: orderStatusEnum("order_status")
			.default("pending_payment")
			.notNull(),
		paymentStatus: paymentStatusEnum("payment_status")
			.default("unpaid")
			.notNull(),
		subtotalIdr: bigint("subtotal_idr", { mode: "number" }).notNull(),
		discountIdr: bigint("discount_idr", { mode: "number" })
			.default(0)
			.notNull(),
		shippingCostIdr: bigint("shipping_cost_idr", { mode: "number" }).notNull(),
		grandTotalIdr: bigint("grand_total_idr", { mode: "number" }).notNull(),
		voucherCodeSnapshot: varchar("voucher_code_snapshot", { length: 40 }),
		customerEmailSnapshot: varchar("customer_email_snapshot", {
			length: 255,
		}).notNull(),
		shippingAddressSnapshot: jsonb("shipping_address_snapshot")
			.$type<ShippingAddressSnapshot>()
			.notNull(),
		customerNotes: text("customer_notes"),
		reservedUntil: timestamp("reserved_until", {
			withTimezone: true,
		}).notNull(),
		paidAt: timestamp("paid_at", { withTimezone: true }),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
		cancelReason: text("cancel_reason"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("orders_order_number_uq").on(t.orderNumber),
		uniqueIndex("orders_idempotency_key_uq")
			.on(t.idempotencyKey)
			.where(sql`${t.idempotencyKey} IS NOT NULL`),
		index("orders_user_created_idx").on(t.userId, t.createdAt.desc()),
		index("orders_expiry_worker_idx")
			.on(t.reservedUntil)
			.where(sql`${t.orderStatus} = 'pending_payment'`),
		index("orders_voucher_user_idx")
			.on(t.voucherId, t.userId)
			.where(
				sql`${t.voucherId} IS NOT NULL AND ${t.orderStatus} <> 'cancelled'`,
			),
		check(
			"orders_grand_total_guard",
			sql`${t.grandTotalIdr} = ${t.subtotalIdr} - ${t.discountIdr} + ${t.shippingCostIdr} AND ${t.grandTotalIdr} >= 0`,
		),
	],
);

// 21. order_items Table (Immutable Item Snapshot)

export const orderItems = pgTable(
	"order_items",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		orderId: uuid("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		variantId: uuid("variant_id")
			.notNull()
			.references(() => productVariants.id, { onDelete: "restrict" }),
		skuSnapshot: varchar("sku_snapshot", { length: 64 }).notNull(),
		productNameSnapshot: varchar("product_name_snapshot", {
			length: 200,
		}).notNull(),
		colorSnapshot: varchar("color_snapshot", { length: 60 }).notNull(),
		sizeSnapshot: varchar("size_snapshot", { length: 20 }).notNull(),
		unitPriceIdr: bigint("unit_price_idr", { mode: "number" }).notNull(),
		quantity: integer("quantity").notNull(),
		subtotalIdr: bigint("subtotal_idr", { mode: "number" }).notNull(),
		weightGramsSnapshot: integer("weight_grams_snapshot").notNull(),
		dimensionsCmSnapshot: jsonb("dimensions_cm_snapshot")
			.$type<ItemDimensionsSnapshot>()
			.notNull(),
	},
	(t) => [
		index("order_items_order_id_idx").on(t.orderId),
		check(
			"order_items_calc_guard",
			sql`${t.quantity} > 0 AND ${t.subtotalIdr} = ${t.unitPriceIdr} * ${t.quantity}`,
		),
	],
);

// 22. return_requests Table (RMA: Size Exchange & Refunds)

export const returnRequests = pgTable(
	"return_requests",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		rmaNumber: varchar("rma_number", { length: 32 }).notNull(),
		orderId: uuid("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "restrict" }),
		orderItemId: uuid("order_item_id")
			.notNull()
			.references(() => orderItems.id, { onDelete: "restrict" }),
		userId: uuid("user_id").references(() => users.id, {
			onDelete: "set null",
		}),
		requestType: rmaRequestTypeEnum("request_type").notNull(),
		reasonCode: rmaReasonCodeEnum("reason_code").notNull(),
		reasonDetail: text("reason_detail"),
		replacementVariantId: uuid("replacement_variant_id").references(
			() => productVariants.id,
			{ onDelete: "restrict" },
		),
		evidenceUrls: jsonb("evidence_urls").$type<string[]>().notNull(),
		status: rmaStatusEnum("status").default("requested").notNull(),
		returnCourier: varchar("return_courier", { length: 30 }),
		returnAwb: varchar("return_awb", { length: 64 }),
		refundAmountIdr: bigint("refund_amount_idr", { mode: "number" }),
		qcNotes: text("qc_notes"),
		reviewedBy: uuid("reviewed_by").references(() => users.id, {
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
		uniqueIndex("return_requests_rma_number_uq").on(t.rmaNumber),
		index("return_requests_order_id_idx").on(t.orderId),
		index("return_requests_status_created_idx").on(
			t.status,
			t.createdAt.desc(),
		),
	],
);
