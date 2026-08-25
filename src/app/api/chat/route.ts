import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatSessions, chatMessages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { executePageIndexReasoning } from "@/lib/pageindex-reasoning";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      documentId,
      query,
      sessionId,
      openrouterApiKey,
      openrouterModel,
    } = body;

    if (!documentId || !query) {
      return NextResponse.json(
        { success: false, error: "documentId dan query wajib diisi." },
        { status: 400 }
      );
    }

    // Buat atau gunakan session chat yang ada
    let session = sessionId
      ? await db.query.chatSessions.findFirst({
          where: eq(chatSessions.id, sessionId),
        })
      : null;

    if (!session) {
      const [newSession] = await db
        .insert(chatSessions)
        .values({
          documentId,
          title: query.length > 40 ? query.substring(0, 40) + "..." : query,
        })
        .returning();
      session = newSession;
    }

    // Simpan pesan pengguna
    await db.insert(chatMessages).values({
      sessionId: session.id,
      role: "user",
      content: query,
    });

    // Eksekusi PageIndex Tree Reasoning
    const reasoningResult = await executePageIndexReasoning(documentId, query, {
      openrouterApiKey: openrouterApiKey || process.env.OPENROUTER_API_KEY,
      openrouterModel: openrouterModel || process.env.OPENROUTER_MODEL,
    });

    // Simpan respons asisten ke database dengan riwayat traversal pohon
    const [assistantMessage] = await db
      .insert(chatMessages)
      .values({
        sessionId: session.id,
        role: "assistant",
        content: reasoningResult.answer,
        traversalPath: reasoningResult.traversalPath,
        citedPageNumbers: reasoningResult.citedPageNumbers,
      })
      .returning();

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      messageId: assistantMessage.id,
      answer: reasoningResult.answer,
      traversalPath: reasoningResult.traversalPath,
      citedPageNumbers: reasoningResult.citedPageNumbers,
      visitedNodes: reasoningResult.visitedNodes,
    });
  } catch (error: unknown) {
    console.error("Kesalahan pada API Chat PageIndex:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Terjadi kesalahan pada server chat.",
      },
      { status: 500 }
    );
  }
}
