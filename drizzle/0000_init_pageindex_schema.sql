CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"sessionId" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"traversalPath" jsonb,
	"citedPageNumbers" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"documentId" text,
	"title" text DEFAULT 'Percakapan Baru' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"filename" text NOT NULL,
	"fileType" text NOT NULL,
	"fileSize" integer DEFAULT 0 NOT NULL,
	"totalPages" integer DEFAULT 1 NOT NULL,
	"totalNodes" integer DEFAULT 0 NOT NULL,
	"maxDepth" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tree_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"documentId" text NOT NULL,
	"parentId" text,
	"path" text NOT NULL,
	"level" integer NOT NULL,
	"orderIndex" integer DEFAULT 0 NOT NULL,
	"nodeType" text DEFAULT 'section' NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"content" text,
	"pageNumber" integer,
	"tokenCount" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sessionId_chat_sessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_documentId_documents_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_nodes" ADD CONSTRAINT "tree_nodes_documentId_documents_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tree_nodes" ADD CONSTRAINT "tree_nodes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."tree_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "tree_nodes_documentId_idx" ON "tree_nodes" USING btree ("documentId");--> statement-breakpoint
CREATE INDEX "tree_nodes_parentId_idx" ON "tree_nodes" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "tree_nodes_path_idx" ON "tree_nodes" USING btree ("path");