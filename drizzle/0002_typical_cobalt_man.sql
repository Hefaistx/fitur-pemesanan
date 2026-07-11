CREATE TABLE "delivery_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_id" integer NOT NULL,
	"slot_time" varchar(5) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "delivery_slots" ADD CONSTRAINT "delivery_slots_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;