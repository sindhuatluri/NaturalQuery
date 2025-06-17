ALTER TABLE "query_executions" DROP CONSTRAINT "query_executions_message_id_messages_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "query_executions" ADD CONSTRAINT "query_executions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
