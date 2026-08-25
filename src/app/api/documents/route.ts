import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, treeNodes } from "@/db/schema";
import { desc } from "drizzle-orm";
import { parseDocumentToTree, ExtractedTreeNode } from "@/lib/tree-extractor";
import { ensureSampleDocumentsSeeded } from "@/lib/sample-data";

export async function GET() {
  try {
    // Pastikan dokumen sample tersedia jika DB masih kosong
    await ensureSampleDocumentsSeeded();

    const allDocuments = await db
      .select({
        id: documents.id,
        title: documents.title,
        filename: documents.filename,
        fileType: documents.fileType,
        fileSize: documents.fileSize,
        totalPages: documents.totalPages,
        totalNodes: documents.totalNodes,
        maxDepth: documents.maxDepth,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .orderBy(desc(documents.createdAt));

    return NextResponse.json({ success: true, documents: allDocuments });
  } catch (error: unknown) {
    console.error("Gagal mengambil daftar dokumen:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar dokumen" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const titleInput = formData.get("title") as string | null;

    let content = "";
    let filename = "dokumen.txt";
    let fileType = "text";

    if (file) {
      filename = file.name;
      const ext = filename.split(".").pop()?.toLowerCase() || "txt";
      fileType = ext;

      if (ext === "pdf") {
        const buffer = Buffer.from(await file.arrayBuffer());
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const pdfParse = require("pdf-parse");
          const pdfData = await pdfParse(buffer);
          content = pdfData.text;
        } catch (pdfErr) {
          console.warn("Gagal mengekstrak PDF secara native, membaca teks mentah:", pdfErr);
          content = buffer.toString("utf8");
        }
      } else {
        content = await file.text();
      }
    } else {
      const body = await req.json().catch(() => ({}));
      content = body.content || "";
      filename = body.filename || "dokumen.md";
      fileType = body.fileType || "markdown";
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Konten file tidak boleh kosong." },
        { status: 400 }
      );
    }

    const title = titleInput || filename.replace(/\.[^/.]+$/, "");
    const parsed = parseDocumentToTree(filename, content, fileType);
    parsed.title = title;

    // Simpan ke PostgreSQL via Drizzle
    const [document] = await db
      .insert(documents)
      .values({
        title: parsed.title,
        filename,
        fileType: parsed.fileType,
        fileSize: Buffer.byteLength(content, "utf8"),
        totalPages: parsed.totalPages,
        totalNodes: parsed.totalNodes,
        maxDepth: parsed.maxDepth,
      })
      .returning();

    async function insertNode(node: ExtractedTreeNode, parentId: string | null = null) {
      const [createdNode] = await db
        .insert(treeNodes)
        .values({
          documentId: document.id,
          parentId: parentId,
          path: node.path || "root",
          level: node.level,
          orderIndex: node.orderIndex,
          nodeType: node.nodeType,
          title: node.title,
          summary: node.summary,
          content: node.content || null,
          pageNumber: node.pageNumber || null,
          tokenCount: node.content ? Math.ceil(node.content.length / 4) : 0,
        })
        .returning();

      for (const child of node.children) {
        await insertNode(child, createdNode.id);
      }
    }

    await insertNode(parsed.rootNode, null);

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        totalNodes: document.totalNodes,
        totalPages: document.totalPages,
      },
    });
  } catch (error: unknown) {
    console.error("Gagal memproses upload dokumen:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat memproses dokumen." },
      { status: 500 }
    );
  }
}
