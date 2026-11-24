CREATE TYPE "consent_type" AS ENUM('privacy_policy', 'terms', 'marketing_email', 'marketing_wa');--> statement-breakpoint
CREATE TYPE "dsr_request_type" AS ENUM('access', 'rectification', 'erasure', 'withdraw_consent', 'restriction', 'portability');--> statement-breakpoint
CREATE TYPE "dsr_status" AS ENUM('submitted', 'verifying', 'in_progress', 'completed', 'rejected');--> statement-breakpoint
CREATE TYPE "gender_audience" AS ENUM('men', 'women', 'unisex', 'kids');--> statement-breakpoint
CREATE TYPE "media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "product_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "stock_movement_type" AS ENUM('restock', 'reserve', 'release', 'commit', 'return_restock', 'manual_adjust');--> statement-breakpoint
CREATE TYPE "discount_type" AS ENUM('percentage', 'fixed_amount', 'free_shipping');--> statement-breakpoint
CREATE TYPE "order_status" AS ENUM('pending_payment', 'paid', 'fraud_review', 'packing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned');--> statement-breakpoint
CREATE TYPE "payment_status" AS ENUM('unpaid', 'paid', 'expired', 'failed', 'partial_refunded', 'refunded');--> statement-breakpoint
CREATE TYPE "rma_reason_code" AS ENUM('size_too_small', 'size_too_large', 'defect', 'wrong_item', 'other');--> statement-breakpoint
CREATE TYPE "rma_request_type" AS ENUM('size_exchange', 'refund');--> statement-breakpoint
CREATE TYPE "rma_status" AS ENUM('requested', 'approved', 'rejected', 'item_shipped_back', 'qc_passed', 'qc_failed', 'exchange_shipped', 'refunded', 'completed');--> statement-breakpoint
CREATE TYPE "midtrans_status" AS ENUM('initiated', 'pending', 'capture', 'settlement', 'deny', 'cancel', 'expire', 'failure', 'partial_refund', 'refund', 'chargeback');--> statement-breakpoint
CREATE TYPE "refund_channel" AS ENUM('midtrans_online', 'manual_bank_transfer');--> statement-breakpoint
CREATE TYPE "refund_status" AS ENUM('requested', 'processing', 'confirmed', 'failed');--> statement-breakpoint
CREATE TYPE "shipment_direction" AS ENUM('outbound', 'exchange_outbound');--> statement-breakpoint
CREATE TYPE "shipment_status" AS ENUM('preparing', 'ready_to_ship', 'in_transit', 'out_for_delivery', 'delivered', 'returned_to_sender');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_subject_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"request_type" "dsr_request_type" NOT NULL,
	"status" "dsr_status" DEFAULT 'submitted'::"dsr_status" NOT NULL,
	"deadline_at" timestamp with time zone NOT NULL,
	"handled_by" uuid,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"impersonated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"label" varchar(50) NOT NULL,
	"recipient_name" varchar(120) NOT NULL,
	"recipient_phone" varchar(20) NOT NULL,
	"address_line" text NOT NULL,
	"rajaongkir_subdistrict_id" integer NOT NULL,
	"rajaongkir_district_id" integer,
	"province_name" varchar(100) NOT NULL,
	"city_name" varchar(100) NOT NULL,
	"district_name" varchar(100) NOT NULL,
	"subdistrict_name" varchar(100) NOT NULL,
	"postal_code" varchar(10) NOT NULL,
	"pin_point_lat" numeric(10,7),
	"pin_point_lng" numeric(10,7),
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"consent_type" "consent_type" NOT NULL,
	"policy_version" varchar(20) NOT NULL,
	"granted" boolean NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"phone" varchar(20),
	"role" text DEFAULT 'customer' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"impersonated_by" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"parent_id" uuid,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" text,
	"image_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(120) NOT NULL,
	"slug" varchar(140) NOT NULL,
	"subtitle" text,
	"banner_url" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_collections" (
	"product_id" uuid,
	"collection_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_collections_pkey" PRIMARY KEY("product_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid NOT NULL,
	"color_name" varchar(60),
	"url" text NOT NULL,
	"alt_text" varchar(255) NOT NULL,
	"media_type" "media_type" DEFAULT 'image'::"media_type" NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"product_id" uuid NOT NULL,
	"sku" varchar(64) NOT NULL,
	"color_name" varchar(60) NOT NULL,
	"color_hex" varchar(7) NOT NULL,
	"size_label" varchar(20) NOT NULL,
	"size_sort_order" smallint DEFAULT 0 NOT NULL,
	"price_idr" bigint NOT NULL,
	"compare_at_price_idr" bigint,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"weight_grams" integer NOT NULL,
	"length_cm" integer NOT NULL,
	"width_cm" integer NOT NULL,
	"height_cm" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_stock_guard" CHECK ("stock_quantity" >= 0 AND "reserved_quantity" >= 0 AND "stock_quantity" >= "reserved_quantity"),
	CONSTRAINT "product_variants_weight_positive" CHECK ("weight_grams" > 0)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"category_id" uuid NOT NULL,
	"size_guide_id" uuid,
	"parent_sku" varchar(64) NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"brand" varchar(100) DEFAULT 'Noctura' NOT NULL,
	"description" text NOT NULL,
	"gender_audience" "gender_audience" NOT NULL,
	"material_composition" varchar(255),
	"care_instructions" text,
	"fit_type" varchar(50),
	"base_price_idr" bigint NOT NULL,
	"status" "product_status" DEFAULT 'draft'::"product_status" NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "size_guides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(120) NOT NULL,
	"garment_type" varchar(50) NOT NULL,
	"measurements_json" jsonb NOT NULL,
	"model_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"variant_id" uuid NOT NULL,
	"movement_type" "stock_movement_type" NOT NULL,
	"quantity_delta" integer NOT NULL,
	"reference_type" varchar(30) NOT NULL,
	"reference_id" uuid,
	"actor_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"cart_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_items_quantity_positive" CHECK ("quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"guest_token" varchar(64),
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carts_user_or_guest_guard" CHECK ("user_id" IS NOT NULL OR "guest_token" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"sku_snapshot" varchar(64) NOT NULL,
	"product_name_snapshot" varchar(200) NOT NULL,
	"color_snapshot" varchar(60) NOT NULL,
	"size_snapshot" varchar(20) NOT NULL,
	"unit_price_idr" bigint NOT NULL,
	"quantity" integer NOT NULL,
	"subtotal_idr" bigint NOT NULL,
	"weight_grams_snapshot" integer NOT NULL,
	"dimensions_cm_snapshot" jsonb NOT NULL,
	CONSTRAINT "order_items_calc_guard" CHECK ("quantity" > 0 AND "subtotal_idr" = "unit_price_idr" * "quantity")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_number" varchar(32) NOT NULL,
	"idempotency_key" varchar(64),
	"user_id" uuid,
	"voucher_id" uuid,
	"order_status" "order_status" DEFAULT 'pending_payment'::"order_status" NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid'::"payment_status" NOT NULL,
	"subtotal_idr" bigint NOT NULL,
	"discount_idr" bigint DEFAULT 0 NOT NULL,
	"shipping_cost_idr" bigint NOT NULL,
	"grand_total_idr" bigint NOT NULL,
	"voucher_code_snapshot" varchar(40),
	"customer_email_snapshot" varchar(255) NOT NULL,
	"shipping_address_snapshot" jsonb NOT NULL,
	"customer_notes" text,
	"reserved_until" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_grand_total_guard" CHECK ("grand_total_idr" = "subtotal_idr" - "discount_idr" + "shipping_cost_idr" AND "grand_total_idr" >= 0)
);
--> statement-breakpoint
CREATE TABLE "return_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"rma_number" varchar(32) NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"user_id" uuid,
	"request_type" "rma_request_type" NOT NULL,
	"reason_code" "rma_reason_code" NOT NULL,
	"reason_detail" text,
	"replacement_variant_id" uuid,
	"evidence_urls" jsonb NOT NULL,
	"status" "rma_status" DEFAULT 'requested'::"rma_status" NOT NULL,
	"return_courier" varchar(30),
	"return_awb" varchar(64),
	"refund_amount_idr" bigint,
	"qc_notes" text,
	"reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"code" varchar(40) NOT NULL,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" bigint NOT NULL,
	"min_order_idr" bigint DEFAULT 0 NOT NULL,
	"max_discount_idr" bigint,
	"usage_limit" integer,
	"usage_per_user" integer DEFAULT 1 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vouchers_usage_limit_guard" CHECK ("used_count" >= 0 AND ("usage_limit" IS NULL OR "used_count" <= "usage_limit"))
);
--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"payment_id" uuid NOT NULL,
	"return_request_id" uuid,
	"refund_key" varchar(64) NOT NULL,
	"refund_channel" "refund_channel" NOT NULL,
	"amount_idr" bigint NOT NULL,
	"reason" varchar(255) NOT NULL,
	"status" "refund_status" DEFAULT 'requested'::"refund_status" NOT NULL,
	"midtrans_refund_id" varchar(64),
	"bank_confirmed_at" timestamp with time zone,
	"manual_bank_info" jsonb,
	"initiated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_refunds_amount_positive" CHECK ("amount_idr" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment_webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"payment_id" uuid,
	"idempotency_key" varchar(128) NOT NULL,
	"midtrans_order_id" varchar(50) NOT NULL,
	"transaction_status" varchar(30) NOT NULL,
	"status_code" varchar(10) NOT NULL,
	"signature_valid" boolean NOT NULL,
	"http_status_returned" smallint NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"midtrans_order_id" varchar(50) NOT NULL,
	"midtrans_transaction_id" varchar(64),
	"snap_token" varchar(64) NOT NULL,
	"snap_redirect_url" text NOT NULL,
	"payment_type" varchar(40),
	"acquiring_bank" varchar(40),
	"va_number" varchar(50),
	"gross_amount_idr" bigint NOT NULL,
	"midtrans_status" "midtrans_status" DEFAULT 'initiated'::"midtrans_status" NOT NULL,
	"fraud_status" varchar(20),
	"expires_at" timestamp with time zone NOT NULL,
	"settled_at" timestamp with time zone,
	"raw_response" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"return_request_id" uuid,
	"direction" "shipment_direction" DEFAULT 'outbound'::"shipment_direction" NOT NULL,
	"origin_subdistrict_id" integer NOT NULL,
	"destination_subdistrict_id" integer NOT NULL,
	"courier_code" varchar(20) NOT NULL,
	"courier_service" varchar(50) NOT NULL,
	"etd" varchar(30),
	"actual_weight_grams" integer NOT NULL,
	"volumetric_weight_grams" integer NOT NULL,
	"chargeable_weight_grams" integer NOT NULL,
	"shipping_cost_idr" bigint NOT NULL,
	"awb_number" varchar(64),
	"shipment_status" "shipment_status" DEFAULT 'preparing'::"shipment_status" NOT NULL,
	"tracking_manifest" jsonb,
	"last_tracked_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_rate_cache" (
	"cache_key" varchar(128) PRIMARY KEY,
	"rates_payload" jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_uq" ON "accounts" ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "dsr_status_deadline_idx" ON "data_subject_requests" ("status","deadline_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_uq" ON "sessions" ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_expires_idx" ON "sessions" ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "user_addresses_user_id_idx" ON "user_addresses" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_addresses_user_default_uq" ON "user_addresses" ("user_id") WHERE "is_default" = true;--> statement-breakpoint
CREATE INDEX "user_consents_audit_idx" ON "user_consents" ("user_id","consent_type","recorded_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" ("role");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" ("deleted_at") WHERE "deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "verifications_ident_expires_idx" ON "verifications" ("identifier","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_uq" ON "categories" ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_sort_idx" ON "categories" ("parent_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "collections_slug_uq" ON "collections" ("slug");--> statement-breakpoint
CREATE INDEX "collections_active_dates_idx" ON "collections" ("is_active","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "product_collections_coll_sort_idx" ON "product_collections" ("collection_id","sort_order");--> statement-breakpoint
CREATE INDEX "product_media_prod_color_sort_idx" ON "product_media" ("product_id","color_name","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_uq" ON "product_variants" ("sku");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_prod_color_size_uq" ON "product_variants" ("product_id","color_name","size_label");--> statement-breakpoint
CREATE INDEX "product_variants_prod_active_idx" ON "product_variants" ("product_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_uq" ON "products" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "products_parent_sku_uq" ON "products" ("parent_sku");--> statement-breakpoint
CREATE INDEX "products_status_category_published_idx" ON "products" ("status","category_id","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "size_guides_garment_type_idx" ON "size_guides" ("garment_type");--> statement-breakpoint
CREATE INDEX "stock_movements_variant_created_idx" ON "stock_movements" ("variant_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "stock_movements_ref_idx" ON "stock_movements" ("reference_type","reference_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_cart_variant_uq" ON "cart_items" ("cart_id","variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "carts_user_uq" ON "carts" ("user_id") WHERE "user_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "carts_guest_token_uq" ON "carts" ("guest_token") WHERE "guest_token" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_order_number_uq" ON "orders" ("order_number");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_idempotency_key_uq" ON "orders" ("idempotency_key") WHERE "idempotency_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "orders_user_created_idx" ON "orders" ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "orders_expiry_worker_idx" ON "orders" ("reserved_until") WHERE "order_status" = 'pending_payment';--> statement-breakpoint
CREATE INDEX "orders_voucher_user_idx" ON "orders" ("voucher_id","user_id") WHERE "voucher_id" IS NOT NULL AND "order_status" <> 'cancelled';--> statement-breakpoint
CREATE UNIQUE INDEX "return_requests_rma_number_uq" ON "return_requests" ("rma_number");--> statement-breakpoint
CREATE INDEX "return_requests_order_id_idx" ON "return_requests" ("order_id");--> statement-breakpoint
CREATE INDEX "return_requests_status_created_idx" ON "return_requests" ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "vouchers_code_uq" ON "vouchers" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "wishlists_user_product_uq" ON "wishlists" ("user_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_refunds_refund_key_uq" ON "payment_refunds" ("refund_key");--> statement-breakpoint
CREATE INDEX "payment_refunds_payment_id_idx" ON "payment_refunds" ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_webhook_logs_idempotency_uq" ON "payment_webhook_logs" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payment_webhook_logs_order_received_idx" ON "payment_webhook_logs" ("midtrans_order_id","received_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "payments_midtrans_order_id_uq" ON "payments" ("midtrans_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_midtrans_tx_id_uq" ON "payments" ("midtrans_transaction_id") WHERE "midtrans_transaction_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "payments_order_created_idx" ON "payments" ("order_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "payments_single_settled_per_order_uq" ON "payments" ("order_id") WHERE "midtrans_status" IN ('capture', 'settlement');--> statement-breakpoint
CREATE INDEX "shipments_order_id_idx" ON "shipments" ("order_id");--> statement-breakpoint
CREATE INDEX "shipments_awb_number_idx" ON "shipments" ("awb_number");--> statement-breakpoint
CREATE INDEX "shipments_status_tracking_idx" ON "shipments" ("shipment_status","last_tracked_at");--> statement-breakpoint
CREATE INDEX "shipping_rate_cache_expires_idx" ON "shipping_rate_cache" ("expires_at");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "data_subject_requests" ADD CONSTRAINT "data_subject_requests_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "data_subject_requests" ADD CONSTRAINT "data_subject_requests_handled_by_users_id_fkey" FOREIGN KEY ("handled_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_collections" ADD CONSTRAINT "product_collections_collection_id_collections_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_size_guide_id_size_guides_id_fkey" FOREIGN KEY ("size_guide_id") REFERENCES "size_guides"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variant_id_product_variants_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_voucher_id_vouchers_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_item_id_order_items_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_replacement_variant_id_product_variants_id_fkey" FOREIGN KEY ("replacement_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_reviewed_by_users_id_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_variant_id_product_variants_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_payment_id_payments_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_return_request_id_return_requests_id_fkey" FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_initiated_by_users_id_fkey" FOREIGN KEY ("initiated_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payment_webhook_logs" ADD CONSTRAINT "payment_webhook_logs_payment_id_payments_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_return_request_id_return_requests_id_fkey" FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id") ON DELETE SET NULL;