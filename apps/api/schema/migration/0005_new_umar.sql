ALTER TABLE "query_executions" DROP CONSTRAINT "query_executions_db_connection_id_db_connections_id_fk";
--> statement-breakpoint
ALTER TABLE "table_metadata" DROP CONSTRAINT "table_metadata_db_connection_id_db_connections_id_fk";
--> statement-breakpoint
ALTER TABLE "user_preferences" DROP CONSTRAINT "user_preferences_default_db_connection_db_connections_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_executions" ADD CONSTRAINT "query_executions_db_connection_id_db_connections_id_fk" FOREIGN KEY ("db_connection_id") REFERENCES "public"."db_connections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "table_metadata" ADD CONSTRAINT "table_metadata_db_connection_id_db_connections_id_fk" FOREIGN KEY ("db_connection_id") REFERENCES "public"."db_connections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_default_db_connection_db_connections_id_fk" FOREIGN KEY ("default_db_connection") REFERENCES "public"."db_connections"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
