import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, treeNodes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export interface NestedTreeNode {
  id: string;
  documentId: string;
  parentId: string | null;
  path: string;
  level: number;
  orderIndex: number;
  nodeType: string;
  title: string;
  summary: string;
  content: string | null;
  pageNumber: number | null;
  tokenCount: number;
  children: NestedTreeNode[];
}

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

    const rawNodes = await db
      .select()
      .from(treeNodes)
      .where(eq(treeNodes.documentId, id))
      .orderBy(asc(treeNodes.level), asc(treeNodes.orderIndex));

    // Buat pemetaan map untuk merangkai struktur pohon bersarang (nested tree)
    const nodeMap = new Map<string, NestedTreeNode>();
    const rootNodes: NestedTreeNode[] = [];

    // Inisialisasi map
    for (const node of rawNodes) {
      nodeMap.set(node.id, {
        ...node,
        children: [],
      });
    }

    // Sambungkan parent-child
    for (const node of rawNodes) {
      const current = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(current);
      } else {
        rootNodes.push(current);
      }
    }

    return NextResponse.json({
      success: true,
      document,
      tree: rootNodes.length > 0 ? rootNodes[0] : null,
      allNodes: rawNodes,
    });
  } catch (error: unknown) {
    console.error("Gagal mengambil struktur pohon dokumen:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat struktur pohon" },
      { status: 500 }
    );
  }
}
