import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Table: documents
export const documents = pgTable("documents", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  fileType: text("fileType").notNull(),
  fileSize: integer("fileSize").default(0).notNull(),
  totalPages: integer("totalPages").default(1).notNull(),
  totalNodes: integer("totalNodes").default(0).notNull(),
  maxDepth: integer("maxDepth").default(1).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// 2. Table: tree_nodes
export const treeNodes = pgTable(
  "tree_nodes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    documentId: text("documentId")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    parentId: text("parentId"),
    path: text("path").notNull(),
    level: integer("level").notNull(),
    orderIndex: integer("orderIndex").default(0).notNull(),
    nodeType: text("nodeType").default("section").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    content: text("content"),
    pageNumber: integer("pageNumber"),
    tokenCount: integer("tokenCount").default(0).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("tree_nodes_documentId_idx").on(table.documentId),
    index("tree_nodes_parentId_idx").on(table.parentId),
    index("tree_nodes_path_idx").on(table.path),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "tree_nodes_parentId_fkey",
    }).onDelete("cascade"),
  ]
);

// 3. Table: chat_sessions
export const chatSessions = pgTable("chat_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  documentId: text("documentId").references(() => documents.id, {
    onDelete: "set null",
  }),
  title: text("title").default("Percakapan Baru").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// 4. Table: chat_messages
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("sessionId")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    traversalPath: jsonb("traversalPath"),
    citedPageNumbers: jsonb("citedPageNumbers"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("chat_messages_sessionId_idx").on(table.sessionId)]
);

// Relations
export const documentsRelations = relations(documents, ({ many }) => ({
  nodes: many(treeNodes),
  chatSessions: many(chatSessions),
}));

export const treeNodesRelations = relations(treeNodes, ({ one, many }) => ({
  document: one(documents, {
    fields: [treeNodes.documentId],
    references: [documents.id],
  }),
  parent: one(treeNodes, {
    fields: [treeNodes.parentId],
    references: [treeNodes.id],
    relationName: "treeHierarchy",
  }),
  children: many(treeNodes, {
    relationName: "treeHierarchy",
  }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  document: one(documents, {
    fields: [chatSessions.documentId],
    references: [documents.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));

// Type Definitions
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type TreeNode = typeof treeNodes.$inferSelect;
export type NewTreeNode = typeof treeNodes.$inferInsert;

export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
