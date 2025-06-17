ALTER TABLE "chats" DROP CONSTRAINT "chats_db_connection_id_db_connections_id_fk";
--> statement-breakpoint
ALTER TABLE "db_connections" DROP CONSTRAINT "db_connections_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_chat_id_chats_id_fk";
--> statement-breakpoint
ALTER TABLE "query_executions" DROP CONSTRAINT "query_executions_saved_query_id_saved_queries_id_fk";
--> statement-breakpoint
ALTER TABLE "saved_queries" DROP CONSTRAINT "saved_queries_db_connection_id_db_connections_id_fk";
--> statement-breakpoint
ALTER TABLE "saved_queries" DROP CONSTRAINT "saved_queries_owner_id_users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chats" ADD CONSTRAINT "chats_db_connection_id_db_connections_id_fk" FOREIGN KEY ("db_connection_id") REFERENCES "public"."db_connections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "db_connections" ADD CONSTRAINT "db_connections_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_executions" ADD CONSTRAINT "query_executions_saved_query_id_saved_queries_id_fk" FOREIGN KEY ("saved_query_id") REFERENCES "public"."saved_queries"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_queries" ADD CONSTRAINT "saved_queries_db_connection_id_db_connections_id_fk" FOREIGN KEY ("db_connection_id") REFERENCES "public"."db_connections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_queries" ADD CONSTRAINT "saved_queries_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
