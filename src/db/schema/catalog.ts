import { sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	bigint,
	boolean,
	check,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	smallint,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth.ts";

// Enums for Domain 2

export const genderAudienceEnum = pgEnum("gender_audience", [
	"men",
	"women",
	"unisex",
	"kids",
]);

export const productStatusEnum = pgEnum("product_status", [
	"draft",
	"published",
	"archived",
]);

export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
	"restock",
	"reserve",
	"release",
	"commit",
	"return_restock",
	"manual_adjust",
]);

// Types for Domain 2

export type SizeGuideMeasurementRow = {
	size: string;
	chestWidthCm?: number;
	bodyLengthCm?: number;
	waistWidthCm?: number;
	hipWidthCm?: number;
	sleeveLengthCm?: number;
	[customDimension: string]: string | number | undefined;
};

export type SizeGuideMatrix = {
	unit: "cm" | "inch";
	rows: SizeGuideMeasurementRow[];
};

// 8. categories Table (Self-referencing tree)

export const categories = pgTable(
	"categories",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
			onDelete: "set null",
		}),
		name: varchar("name", { length: 100 }).notNull(),
		slug: varchar("slug", { length: 120 }).notNull(),
		description: text("description"),
		imageUrl: text("image_url"),
		sortOrder: integer("sort_order").default(0).notNull(),
		isActive: boolean("is_active").default(true).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("categories_slug_uq").on(t.slug),
		index("categories_parent_sort_idx").on(t.parentId, t.sortOrder),
	],
);

// 9. collections Table (Editorial Lookbooks & Seasonal Drops)

export const collections = pgTable(
	"collections",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: varchar("name", { length: 120 }).notNull(),
		slug: varchar("slug", { length: 140 }).notNull(),
		subtitle: text("subtitle"),
		bannerUrl: text("banner_url"),
		startsAt: timestamp("starts_at", { withTimezone: true }),
		endsAt: timestamp("ends_at", { withTimezone: true }),
		isActive: boolean("is_active").default(true).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("collections_slug_uq").on(t.slug),
		index("collections_active_dates_idx").on(t.isActive, t.startsAt, t.endsAt),
	],
);

// 10. size_guides Table (Garment Measurements Matrix)

export const sizeGuides = pgTable(
	"size_guides",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: varchar("name", { length: 120 }).notNull(),
		garmentType: varchar("garment_type", { length: 50 }).notNull(),
		measurementsJson: jsonb("measurements_json")
			.$type<SizeGuideMatrix>()
			.notNull(),
		modelNote: text("model_note"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [index("size_guides_garment_type_idx").on(t.garmentType)],
);

// 11. products Table (ProductGroup Parent Entity)

export const products = pgTable(
	"products",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		categoryId: uuid("category_id")
			.notNull()
			.references(() => categories.id, { onDelete: "restrict" }),
		sizeGuideId: uuid("size_guide_id").references(() => sizeGuides.id, {
			onDelete: "set null",
		}),
		parentSku: varchar("parent_sku", { length: 64 }).notNull(),
		name: varchar("name", { length: 200 }).notNull(),
		slug: varchar("slug", { length: 220 }).notNull(),
		brand: varchar("brand", { length: 100 }).default("Noctura").notNull(),
		description: text("description").notNull(),
		genderAudience: genderAudienceEnum("gender_audience").notNull(),
		materialComposition: varchar("material_composition", { length: 255 }),
		careInstructions: text("care_instructions"),
		fitType: varchar("fit_type", { length: 50 }),
		basePriceIdr: bigint("base_price_idr", { mode: "number" }).notNull(),
		status: productStatusEnum("status").default("draft").notNull(),
		publishedAt: timestamp("published_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("products_slug_uq").on(t.slug),
		uniqueIndex("products_parent_sku_uq").on(t.parentSku),
		index("products_status_category_published_idx").on(
			t.status,
			t.categoryId,
			t.publishedAt.desc(),
		),
	],
);

// 12. product_collections Table (N:M Junction)

export const productCollections = pgTable(
	"product_collections",
	{
		productId: uuid("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		collectionId: uuid("collection_id")
			.notNull()
			.references(() => collections.id, { onDelete: "cascade" }),
		sortOrder: integer("sort_order").default(0).notNull(),
	},
	(t) => [
		primaryKey({ columns: [t.productId, t.collectionId] }),
		index("product_collections_coll_sort_idx").on(t.collectionId, t.sortOrder),
	],
);

// 13. product_variants Table (SKU with Anti-Overselling Guard)

export const productVariants = pgTable(
	"product_variants",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		productId: uuid("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		sku: varchar("sku", { length: 64 }).notNull(),
		colorName: varchar("color_name", { length: 60 }).notNull(),
		colorHex: varchar("color_hex", { length: 7 }).notNull(),
		sizeLabel: varchar("size_label", { length: 20 }).notNull(),
		sizeSortOrder: smallint("size_sort_order").default(0).notNull(),
		priceIdr: bigint("price_idr", { mode: "number" }).notNull(),
		compareAtPriceIdr: bigint("compare_at_price_idr", { mode: "number" }),
		stockQuantity: integer("stock_quantity").default(0).notNull(),
		reservedQuantity: integer("reserved_quantity").default(0).notNull(),
		weightGrams: integer("weight_grams").notNull(),
		lengthCm: integer("length_cm").notNull(),
		widthCm: integer("width_cm").notNull(),
		heightCm: integer("height_cm").notNull(),
		isActive: boolean("is_active").default(true).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		uniqueIndex("product_variants_sku_uq").on(t.sku),
		uniqueIndex("product_variants_prod_color_size_uq").on(
			t.productId,
			t.colorName,
			t.sizeLabel,
		),
		index("product_variants_prod_active_idx").on(t.productId, t.isActive),
		check(
			"product_variants_stock_guard",
			sql`${t.stockQuantity} >= 0 AND ${t.reservedQuantity} >= 0 AND ${t.stockQuantity} >= ${t.reservedQuantity}`,
		),
		check("product_variants_weight_positive", sql`${t.weightGrams} > 0`),
	],
);

// 14. product_media Table (Color Swatch Gallery & Video)

export const productMedia = pgTable(
	"product_media",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		productId: uuid("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		colorName: varchar("color_name", { length: 60 }),
		url: text("url").notNull(),
		altText: varchar("alt_text", { length: 255 }).notNull(),
		mediaType: mediaTypeEnum("media_type").default("image").notNull(),
		isPrimary: boolean("is_primary").default(false).notNull(),
		sortOrder: smallint("sort_order").default(0).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		index("product_media_prod_color_sort_idx").on(
			t.productId,
			t.colorName,
			t.sortOrder,
		),
	],
);

// 15. stock_movements Table (Append-Only Inventory Ledger)

export const stockMovements = pgTable(
	"stock_movements",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		variantId: uuid("variant_id")
			.notNull()
			.references(() => productVariants.id, { onDelete: "restrict" }),
		movementType: stockMovementTypeEnum("movement_type").notNull(),
		quantityDelta: integer("quantity_delta").notNull(),
		referenceType: varchar("reference_type", { length: 30 }).notNull(),
		referenceId: uuid("reference_id"),
		actorId: uuid("actor_id").references(() => users.id, {
			onDelete: "set null",
		}),
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(t) => [
		index("stock_movements_variant_created_idx").on(
			t.variantId,
			t.createdAt.desc(),
		),
		index("stock_movements_ref_idx").on(t.referenceType, t.referenceId),
	],
);
