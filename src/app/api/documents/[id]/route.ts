import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, treeNodes, chatSessions } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await db.query.documents.findFirst({
      where: eq(documents.id, id),
    });

    if (!document) {
      return NextResponse.json({ success: false, error: "Dokumen tidak ditemukan" }, { status: 404 });
    }

    const [nodesCountResult] = await db
      .select({ count: count() })
      .from(treeNodes)
      .where(eq(treeNodes.documentId, id));

    const [chatCountResult] = await db
      .select({ count: count() })
      .from(chatSessions)
      .where(eq(chatSessions.documentId, id));

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        _count: {
          nodes: nodesCountResult?.count || 0,
          chatSessions: chatCountResult?.count || 0,
        },
      },
    });
  } catch (error: unknown) {
    console.error("Gagal mengambil detail dokumen:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(documents).where(eq(documents.id, id));

    return NextResponse.json({ success: true, message: "Dokumen berhasil dihapus" });
  } catch (error: unknown) {
    console.error("Gagal menghapus dokumen:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus dokumen" }, { status: 500 });
  }
}
