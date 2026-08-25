import { db } from "./db";
import { documents, treeNodes } from "@/db/schema";
import { count } from "drizzle-orm";
import { parseDocumentToTree, ExtractedTreeNode } from "./tree-extractor";

export const SAMPLE_DOCUMENTS = [
  {
    title: "Buku Putih Tata Kelola AI dan Etika Nasional 2026",
    filename: "buku-putih-tata-kelola-ai-2026.md",
    fileType: "markdown",
    content: `# Buku Putih Tata Kelola AI dan Etika Nasional 2026

## 1. Pendahuluan dan Latar Belakang
--- Halaman 1 ---
Perkembangan teknologi kecerdasan buatan (Artificial Intelligence / AI) di Indonesia berkembang dengan laju eksponensial. Penerapan Generative AI, Large Language Models (LLM), dan sistem otonom telah diadopsi di sektor finansial, kesehatan, logistik, dan layanan publik.
Buku Putih ini disusun untuk menjadi pedoman nasional bagi pengembang, industri, dan akademisi dalam memastikan adopsi AI yang aman, transparan, dan berpusat pada manusia (human-centric AI).

--- Halaman 2 ---
Prinsip utama yang diusung dalam regulasi ini mencakup empat pilar:
1. Akuntabilitas algoritma dan transparansi model
2. Perlindungan data pribadi dan privasi pengguna
3. Keamanan sistem dan mitigasi bias algoritmik
4. Kedaulatan data dan kepatuhan hukum nasional

## 2. Standar Kepatuhan dan Audit Model AI
--- Halaman 3 ---
### 2.1 Klasifikasi Tingkat Risiko Sistem AI
Setiap sistem AI yang beroperasi di wilayah hukum Indonesia wajib diklasifikasikan ke dalam 4 kategori risiko:
- **Risiko Tidak Dapat Diterima (Unacceptable Risk)**: Sistem AI manipulatif subliminal, eksploitasi kerentanan manusia, atau social scoring oleh otoritas publik tanpa dasar hukum. Sistem jenis ini DILARANG sepenuhnya.
- **Risiko Tinggi (High Risk)**: Sistem AI yang digunakan dalam infrastruktur kritis (listrik, air), alat kesehatan, rekrutmen kerja otomatis, credit scoring, dan pengenalan biometrik jarak jauh secara realtime di ruang publik.
- **Risiko Terbatas (Limited Risk)**: Chatbot interaktif, sistem deepfake, dan AI pengubah media. Wajib mencantumkan label "Dihasilkan oleh AI" (AI Transparency Disclosure).
- **Risiko Minimal (Minimal Risk)**: Filter spam email, rekomendasi game, dan asisten produktivitas perkantoran standar.

--- Halaman 4 ---
### 2.2 Persyaratan Teknis untuk Sistem AI Risiko Tinggi
Sistem dalam kategori risiko tinggi wajib memenuhi:
1. **Pemeriksaan Bias Data**: Data latih (training data) harus bebas dari bias diskriminatif suku, agama, ras, dan gender.
2. **Human-in-the-Loop (HITL)**: Wajib menyediakan mekanisme intervensi manusia untuk membatalkan atau mengoreksi keputusan otomatis AI.
3. **Pencatatan Audit Trail**: Log inferensi dan keputusan wajib disimpan selama minimal 5 (lima) tahun untuk keperluan audit forensik digital.

## 3. Perlindungan Data Pribadi dan Hak Cipta Pelatihan
--- Halaman 5 ---
### 3.1 Kebijakan Data Training AI
Pengembang model LLM dan generative AI dilarang melakukan web scraping pada basis data yang dilindungi hak cipta tanpa lisensi eksplisit dari pemilik konten.
Penggunaan Data Pribadi Spesifik (data kesehatan, data finansial, data biometrik) untuk fine-tuning model memerlukan persetujuan eksplisit (explicit consent) dari subjek data sesuai UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).

--- Halaman 6 ---
### 3.2 Hak Subjek Data Terhadap Output AI
Setiap warga negara berhak meminta penjelasan logis mengenai keputusan yang dihasilkan oleh sistem otomatis, serta berhak menolak keputusan yang hanya didasarkan pada pemrosesan otomatis jika berdampak signifikan secara hukum atau finansial.

## 4. Sanksi Pelanggaran dan Pengawasan
--- Halaman 7 ---
Badan Pengawas AI Nasional (BPAIN) berwenang melakukan audit berkala, membekukan izin operasi sistem AI berbahaya, serta menjatuhkan denda administratif hingga maksimal 5% dari pendapatan tahunan global bagi entitas korporasi yang melanggar ketentuan kategori Risiko Tinggi.
`,
  },
  {
    title: "Panduan Arsitektur Cloud Native & Keamanan Siber",
    filename: "panduan-arsitektur-cloud-keamanan.md",
    fileType: "markdown",
    content: `# Panduan Arsitektur Cloud Native & Keamanan Siber

## 1. Fondasi Infrastruktur Cloud Native
--- Halaman 1 ---
Arsitektur modern mengandalkan kontainerisasi (Docker), orkestrasi (Kubernetes), dan pendekatan microservices. Desain sistem cloud native harus mengutamakan ketersediaan tinggi (High Availability), elastisitas beban kerja, dan pemulihan bencana (Disaster Recovery) dengan RPO < 15 menit dan RTO < 1 jam.

--- Halaman 2 ---
### 1.1 Pola Desain Microservices
Penerapan arsitektur microservices harus menerapkan:
- **Database per Service**: Setiap service memiliki schema atau database terisolasi untuk menghindari tight coupling.
- **Event-Driven Architecture**: Komunikasi asinkron antar service menggunakan message broker seperti Apache Kafka atau RabbitMQ.
- **Circuit Breaker Pattern**: Mencegah cascading failure saat salah satu downstream service mengalami penurunan performa.

## 2. Keamanan Siber & Enkripsi Data
--- Halaman 3 ---
### 2.1 Standar Enkripsi Data
Seluruh sistem yang menangani data sensitif wajib menerapkan:
- **Enkripsi Transit (In-Transit)**: Protokol TLS 1.3 wajib digunakan untuk seluruh komunikasi internal dan eksternal. Cipher suites yang diizinkan adalah AES-256-GCM atau ChaCha20-Poly1305.
- **Enkripsi At-Rest**: Penyimpanan database dan block storage dienkripsi menggunakan AES-256 dengan manajemen kunci terisolasi (KMS / Hardware Security Module).
- **Enkripsi End-to-End**: Data kredensial pengguna dan token autentikasi di-hash menggunakan algoritma Argon2id atau bcrypt dengan work factor memadai.

--- Halaman 4 ---
### 2.2 Prinsip Zero Trust Architecture (ZTA)
Prinsip utama Zero Trust adalah "Never Trust, Always Verify":
1. **Identitas Terverifikasi Kuat**: Multi-Factor Authentication (MFA) berbasis hardware token atau FIDO2 wajib untuk akses internal.
2. **Least Privilege Access**: Hak akses berbasis Role-Based Access Control (RBAC) dengan review periodik setiap 90 hari.
3. **Mikrosegmentasi Jaringan**: Setiap pod dan virtual machine diisolasi dengan Network Policy ketat tanpa akses broadcast langsung antar tier.
`,
  },
];

/**
 * Menyimpan struktur pohon dokumen ke PostgreSQL melalui Drizzle ORM
 */
export async function seedDocumentTree(docData: {
  title: string;
  filename: string;
  fileType: string;
  content: string;
}) {
  const parsed = parseDocumentToTree(docData.filename, docData.content, docData.fileType);

  // Buat record Document
  const [document] = await db
    .insert(documents)
    .values({
      title: parsed.title,
      filename: docData.filename,
      fileType: parsed.fileType,
      fileSize: Buffer.byteLength(docData.content, "utf8"),
      totalPages: parsed.totalPages,
      totalNodes: parsed.totalNodes,
      maxDepth: parsed.maxDepth,
    })
    .returning();

  // Simpan pohon node secara rekursif
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
  return document;
}

export async function ensureSampleDocumentsSeeded() {
  const [result] = await db.select({ value: count() }).from(documents);
  if (result && result.value > 0) return;

  for (const sample of SAMPLE_DOCUMENTS) {
    await seedDocumentTree(sample);
  }
}
