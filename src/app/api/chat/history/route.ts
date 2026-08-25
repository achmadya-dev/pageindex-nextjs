import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatSessions, chatMessages } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId");
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, sessionId))
        .orderBy(asc(chatMessages.createdAt));

      const parsedMessages = messages.map((m) => ({
        ...m,
        traversalPath:
          typeof m.traversalPath === "string"
            ? JSON.parse(m.traversalPath)
            : m.traversalPath,
        citedPageNumbers:
          typeof m.citedPageNumbers === "string"
            ? JSON.parse(m.citedPageNumbers)
            : m.citedPageNumbers,
      }));

      return NextResponse.json({ success: true, messages: parsedMessages });
    }

    if (documentId) {
      const sessions = await db.query.chatSessions.findMany({
        where: eq(chatSessions.documentId, documentId),
        orderBy: [desc(chatSessions.updatedAt)],
        with: {
          messages: {
            limit: 1,
            orderBy: [desc(chatMessages.createdAt)],
          },
        },
      });

      return NextResponse.json({ success: true, sessions });
    }

    const allSessions = await db.query.chatSessions.findMany({
      orderBy: [desc(chatSessions.updatedAt)],
      limit: 20,
    });

    return NextResponse.json({ success: true, sessions: allSessions });
  } catch (error: unknown) {
    console.error("Gagal mengambil riwayat percakapan:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil riwayat chat" },
      { status: 500 }
    );
  }
}
