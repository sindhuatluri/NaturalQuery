CREATE TABLE IF NOT EXISTS "chats" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"db_connection_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "db_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"host" varchar(255) NOT NULL,
	"port" integer NOT NULL,
	"database" varchar(255) NOT NULL,
	"credentials" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"description" text,
	"owner_id" text NOT NULL,
	"last_connected_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"role" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"has_tool_use" boolean DEFAULT false NOT NULL,
	"tool_use" jsonb,
	"chart_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "query_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"saved_query_id" text,
	"db_connection_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"sql_query" text NOT NULL,
	"execution_time" integer,
	"status" varchar(50) NOT NULL,
	"error" text,
	"result" jsonb,
	"rows_affected" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_queries" (
	"id" text PRIMARY KEY NOT NULL,
	"db_connection_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"natural_language_query" text NOT NULL,
	"sql_query" text NOT NULL,
	"tags" text[],
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "table_metadata" (
	"id" text PRIMARY KEY NOT NULL,
	"db_connection_id" text NOT NULL,
	"table_name" text NOT NULL,
	"ddl" text NOT NULL,
	"description" text,
	"last_sync" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"default_db_connection" text,
	"theme" varchar(50) DEFAULT 'light',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chats" ADD CONSTRAINT "chats_db_connection_id_db_connections_id_fk" FOREIGN KEY ("db_connection_id") REFERENCES "public"."db_connections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chats" ADD CONSTRAINT "chats_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "db_connections" ADD CONSTRAINT "db_connections_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_executions" ADD CONSTRAINT "query_executions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_executions" ADD CONSTRAINT "query_executions_saved_query_id_saved_queries_id_fk" FOREIGN KEY ("saved_query_id") REFERENCES "public"."saved_queries"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_executions" ADD CONSTRAINT "query_executions_db_connection_id_db_connections_id_fk" FOREIGN KEY ("db_connection_id") REFERENCES "public"."db_connections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_executions" ADD CONSTRAINT "query_executions_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_queries" ADD CONSTRAINT "saved_queries_db_connection_id_db_connections_id_fk" FOREIGN KEY ("db_connection_id") REFERENCES "public"."db_connections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_queries" ADD CONSTRAINT "saved_queries_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "table_metadata" ADD CONSTRAINT "table_metadata_db_connection_id_db_connections_id_fk" FOREIGN KEY ("db_connection_id") REFERENCES "public"."db_connections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_default_db_connection_db_connections_id_fk" FOREIGN KEY ("default_db_connection") REFERENCES "public"."db_connections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
