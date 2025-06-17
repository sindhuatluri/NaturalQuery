ALTER TABLE "table_metadata" DROP COLUMN IF EXISTS "table_name";--> statement-breakpoint
ALTER TABLE "table_metadata" ADD CONSTRAINT "table_metadata_db_connection_id_unique" UNIQUE("db_connection_id");--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id");