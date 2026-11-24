import { defineRelations } from "drizzle-orm";
import * as auth from "./auth.ts";
import * as catalog from "./catalog.ts";
import * as logistics from "./logistics.ts";
import * as orders from "./orders.ts";

// Consolidated Schema Tables for Relational Queries V2

export const allTables = {
	...auth,
	...catalog,
	...orders,
	...logistics,
};

// Drizzle ORM v1.0.0-rc.6 Relational Queries V2 Definition

export const relations = defineRelations(allTables, (r) => ({
	// Domain 1: Auth & Privacy
	users: {
		sessions: r.many.sessions(),
		accounts: r.many.accounts(),
		addresses: r.many.userAddresses(),
		consents: r.many.userConsents(),
		dsrRequests: r.many.dataSubjectRequests({
			from: r.users.id,
			to: r.dataSubjectRequests.userId,
		}),
		handledDsrRequests: r.many.dataSubjectRequests({
			from: r.users.id,
			to: r.dataSubjectRequests.handledBy,
		}),
		stockMovements: r.many.stockMovements(),
		carts: r.many.carts(),
		wishlists: r.many.wishlists(),
		orders: r.many.orders(),
		returnRequests: r.many.returnRequests({
			from: r.users.id,
			to: r.returnRequests.userId,
		}),
		reviewedReturnRequests: r.many.returnRequests({
			from: r.users.id,
			to: r.returnRequests.reviewedBy,
		}),
		initiatedRefunds: r.many.paymentRefunds(),
	},
	sessions: {
		user: r.one.users({ from: r.sessions.userId, to: r.users.id }),
	},
	accounts: {
		user: r.one.users({ from: r.accounts.userId, to: r.users.id }),
	},
	userAddresses: {
		user: r.one.users({ from: r.userAddresses.userId, to: r.users.id }),
	},
	userConsents: {
		user: r.one.users({ from: r.userConsents.userId, to: r.users.id }),
	},
	dataSubjectRequests: {
		user: r.one.users({
			from: r.dataSubjectRequests.userId,
			to: r.users.id,
		}),
		handler: r.one.users({
			from: r.dataSubjectRequests.handledBy,
			to: r.users.id,
		}),
	},

	// Domain 2: Catalog & Inventory
	categories: {
		parent: r.one.categories({
			from: r.categories.parentId,
			to: r.categories.id,
		}),
		children: r.many.categories({
			from: r.categories.id,
			to: r.categories.parentId,
		}),
		products: r.many.products(),
	},
	collections: {
		productCollections: r.many.productCollections(),
	},
	sizeGuides: {
		products: r.many.products(),
	},
	products: {
		category: r.one.categories({
			from: r.products.categoryId,
			to: r.categories.id,
		}),
		sizeGuide: r.one.sizeGuides({
			from: r.products.sizeGuideId,
			to: r.sizeGuides.id,
		}),
		productCollections: r.many.productCollections(),
		variants: r.many.productVariants(),
		media: r.many.productMedia(),
		wishlists: r.many.wishlists(),
	},
	productCollections: {
		product: r.one.products({
			from: r.productCollections.productId,
			to: r.products.id,
		}),
		collection: r.one.collections({
			from: r.productCollections.collectionId,
			to: r.collections.id,
		}),
	},
	productVariants: {
		product: r.one.products({
			from: r.productVariants.productId,
			to: r.products.id,
		}),
		stockMovements: r.many.stockMovements(),
		cartItems: r.many.cartItems(),
		wishlists: r.many.wishlists(),
		orderItems: r.many.orderItems(),
		replacementReturnRequests: r.many.returnRequests({
			from: r.productVariants.id,
			to: r.returnRequests.replacementVariantId,
		}),
	},
	productMedia: {
		product: r.one.products({
			from: r.productMedia.productId,
			to: r.products.id,
		}),
	},
	stockMovements: {
		variant: r.one.productVariants({
			from: r.stockMovements.variantId,
			to: r.productVariants.id,
		}),
		actor: r.one.users({
			from: r.stockMovements.actorId,
			to: r.users.id,
		}),
	},

	// Domain 3: Carts, Promotions, Orders & RMA
	carts: {
		user: r.one.users({ from: r.carts.userId, to: r.users.id }),
		items: r.many.cartItems(),
	},
	cartItems: {
		cart: r.one.carts({ from: r.cartItems.cartId, to: r.carts.id }),
		variant: r.one.productVariants({
			from: r.cartItems.variantId,
			to: r.productVariants.id,
		}),
	},
	wishlists: {
		user: r.one.users({ from: r.wishlists.userId, to: r.users.id }),
		product: r.one.products({
			from: r.wishlists.productId,
			to: r.products.id,
		}),
		variant: r.one.productVariants({
			from: r.wishlists.variantId,
			to: r.productVariants.id,
		}),
	},
	vouchers: {
		orders: r.many.orders(),
	},
	orders: {
		user: r.one.users({ from: r.orders.userId, to: r.users.id }),
		voucher: r.one.vouchers({
			from: r.orders.voucherId,
			to: r.vouchers.id,
		}),
		items: r.many.orderItems(),
		returnRequests: r.many.returnRequests(),
		payments: r.many.payments(),
		shipments: r.many.shipments(),
	},
	orderItems: {
		order: r.one.orders({ from: r.orderItems.orderId, to: r.orders.id }),
		variant: r.one.productVariants({
			from: r.orderItems.variantId,
			to: r.productVariants.id,
		}),
		returnRequests: r.many.returnRequests(),
	},
	returnRequests: {
		order: r.one.orders({
			from: r.returnRequests.orderId,
			to: r.orders.id,
		}),
		orderItem: r.one.orderItems({
			from: r.returnRequests.orderItemId,
			to: r.orderItems.id,
		}),
		user: r.one.users({ from: r.returnRequests.userId, to: r.users.id }),
		replacementVariant: r.one.productVariants({
			from: r.returnRequests.replacementVariantId,
			to: r.productVariants.id,
		}),
		reviewer: r.one.users({
			from: r.returnRequests.reviewedBy,
			to: r.users.id,
		}),
		refunds: r.many.paymentRefunds(),
		shipments: r.many.shipments(),
	},

	// Domain 4: Payments & Logistics
	payments: {
		order: r.one.orders({ from: r.payments.orderId, to: r.orders.id }),
		webhookLogs: r.many.paymentWebhookLogs(),
		refunds: r.many.paymentRefunds(),
	},
	paymentWebhookLogs: {
		payment: r.one.payments({
			from: r.paymentWebhookLogs.paymentId,
			to: r.payments.id,
		}),
	},
	paymentRefunds: {
		payment: r.one.payments({
			from: r.paymentRefunds.paymentId,
			to: r.payments.id,
		}),
		returnRequest: r.one.returnRequests({
			from: r.paymentRefunds.returnRequestId,
			to: r.returnRequests.id,
		}),
		initiator: r.one.users({
			from: r.paymentRefunds.initiatedBy,
			to: r.users.id,
		}),
	},
	shipments: {
		order: r.one.orders({ from: r.shipments.orderId, to: r.orders.id }),
		returnRequest: r.one.returnRequests({
			from: r.shipments.returnRequestId,
			to: r.returnRequests.id,
		}),
	},
}));
