import { NextResponse } from "next/server";
import { SAMPLE_DOCUMENTS, seedDocumentTree } from "@/lib/sample-data";

export async function POST() {
  try {
    const createdDocs = [];
    for (const sample of SAMPLE_DOCUMENTS) {
      const doc = await seedDocumentTree(sample);
      createdDocs.push(doc);
    }

    return NextResponse.json({
      success: true,
      message: "Dokumen demo berhasil dimuat.",
      documents: createdDocs,
    });
  } catch (error: unknown) {
    console.error("Gagal memuat dokumen demo:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat dokumen demo." },
      { status: 500 }
    );
  }
}
