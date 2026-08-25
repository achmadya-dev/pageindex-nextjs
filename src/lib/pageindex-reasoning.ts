import { db } from "./db";
import { documents, type TreeNode } from "@/db/schema";
import { eq } from "drizzle-orm";
import { OpenRouter } from "@openrouter/sdk";

export interface TraversalStep {
  step: number;
  nodeId: string;
  title: string;
  level: number;
  nodeType: string;
  pageNumber: number | null;
  reason: string;
  summary: string;
}

export interface PageIndexReasoningResult {
  answer: string;
  traversalPath: TraversalStep[];
  citedPageNumbers: number[];
  visitedNodes: {
    id: string;
    title: string;
    level: number;
    pageNumber: number | null;
  }[];
}

export interface AIConfig {
  openrouterApiKey?: string;
  openrouterModel?: string;
}

/**
 * Algoritma PageIndex Tree Reasoning
 * Melakukan navigasi pohon dokumen secara hirarki dari tingkat Root -> Bab -> Sub-bab -> Halaman
 */
export async function executePageIndexReasoning(
  documentId: string,
  userQuery: string,
  config: AIConfig
): Promise<PageIndexReasoningResult> {
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
    with: {
      nodes: {
        orderBy: (nodes, { asc }) => [asc(nodes.level), asc(nodes.orderIndex)],
      },
    },
  });

  if (!document || !document.nodes || document.nodes.length === 0) {
    throw new Error("Dokumen atau struktur pohon tidak ditemukan");
  }

  const nodes: TreeNode[] = document.nodes;
  const rootNode: TreeNode = nodes.find((n) => n.parentId === null) || nodes[0];
  const traversalPath: TraversalStep[] = [];
  const visitedNodes: { id: string; title: string; level: number; pageNumber: number | null }[] = [];
  const citedPageSet = new Set<number>();

  // Langkah 1: Root Node
  traversalPath.push({
    step: 1,
    nodeId: rootNode.id,
    title: rootNode.title,
    level: rootNode.level,
    nodeType: rootNode.nodeType,
    pageNumber: rootNode.pageNumber,
    reason: `Memulai penelusuran dari akar dokumen '${document.title}' untuk menganalisis daftar isi dan topik utama.`,
    summary: rootNode.summary,
  });
  visitedNodes.push({
    id: rootNode.id,
    title: rootNode.title,
    level: rootNode.level,
    pageNumber: rootNode.pageNumber,
  });

  // Langkah 2: Ambil anak langsung dari Root (Level 1 / Bab)
  const level1Nodes = nodes.filter((n) => n.parentId === rootNode.id);
  let selectedLevel1 = selectBestNode(userQuery, level1Nodes);

  if (!selectedLevel1 && level1Nodes.length > 0) {
    selectedLevel1 = level1Nodes[0];
  }

  if (selectedLevel1) {
    traversalPath.push({
      step: 2,
      nodeId: selectedLevel1.id,
      title: selectedLevel1.title,
      level: selectedLevel1.level,
      nodeType: selectedLevel1.nodeType,
      pageNumber: selectedLevel1.pageNumber,
      reason: `Mengarahkan pencarian ke '${selectedLevel1.title}' karena ringkasan mencakup kata kunci yang paling relevan dengan pertanyaan pengguna.`,
      summary: selectedLevel1.summary,
    });
    visitedNodes.push({
      id: selectedLevel1.id,
      title: selectedLevel1.title,
      level: selectedLevel1.level,
      pageNumber: selectedLevel1.pageNumber,
    });

    if (selectedLevel1.pageNumber) {
      citedPageSet.add(selectedLevel1.pageNumber);
    }

    // Langkah 3: Ambil anak dari Sub-bab (Level 2 / Seksi)
    const level2Nodes = nodes.filter((n) => n.parentId === selectedLevel1.id);
    const selectedLevel2 = selectBestNode(userQuery, level2Nodes);

    if (selectedLevel2) {
      traversalPath.push({
        step: 3,
        nodeId: selectedLevel2.id,
        title: selectedLevel2.title,
        level: selectedLevel2.level,
        nodeType: selectedLevel2.nodeType,
        pageNumber: selectedLevel2.pageNumber,
        reason: `Mempersempit pencarian ke sub-seksi '${selectedLevel2.title}' berdasarkan kecocokan semantik konten.`,
        summary: selectedLevel2.summary,
      });
      visitedNodes.push({
        id: selectedLevel2.id,
        title: selectedLevel2.title,
        level: selectedLevel2.level,
        pageNumber: selectedLevel2.pageNumber,
      });

      if (selectedLevel2.pageNumber) {
        citedPageSet.add(selectedLevel2.pageNumber);
      }

      // Langkah 4: Ambil leaf nodes (Halaman spesifik / Chunk)
      const leafNodes = nodes.filter((n) => n.parentId === selectedLevel2.id);
      const selectedLeaf = selectBestNode(userQuery, leafNodes);

      if (selectedLeaf) {
        traversalPath.push({
          step: 4,
          nodeId: selectedLeaf.id,
          title: selectedLeaf.title,
          level: selectedLeaf.level,
          nodeType: selectedLeaf.nodeType,
          pageNumber: selectedLeaf.pageNumber,
          reason: `Menemukan node daun paling relevan pada '${selectedLeaf.title}' untuk ekstraksi bukti teks.`,
          summary: selectedLeaf.summary,
        });
        visitedNodes.push({
          id: selectedLeaf.id,
          title: selectedLeaf.title,
          level: selectedLeaf.level,
          pageNumber: selectedLeaf.pageNumber,
        });

        if (selectedLeaf.pageNumber) {
          citedPageSet.add(selectedLeaf.pageNumber);
        }
      }
    }
  }

  // Kumpulkan semua konten teks dari node-node yang dikunjungi
  const targetNodeIds = new Set(visitedNodes.map((n) => n.id));
  const relevantNodes = nodes.filter((n) => targetNodeIds.has(n.id) || (n.content && targetNodeIds.has(n.parentId || "")));

  const contextSnippets = relevantNodes
    .filter((n) => n.content && n.content.trim().length > 0)
    .map((n) => `[Sumber: ${n.title} - Halaman ${n.pageNumber || 1}]\n${n.content}`)
    .join("\n\n---\n\n");

  const fallbackSummaryContext = relevantNodes
    .map((n) => `- ${n.title} (Hal ${n.pageNumber || 1}): ${n.summary}`)
    .join("\n");

  const fullContext = contextSnippets.length > 0 ? contextSnippets : fallbackSummaryContext;
  const citedPages = Array.from(citedPageSet).sort((a, b) => a - b);

  // Sintesis jawaban via LLM (@openrouter/sdk) atau Heuristic Engine lokal
  let answer = "";

  const rawKey = (config.openrouterApiKey || process.env.OPENROUTER_API_KEY || "").trim();
  const openrouterKey = rawKey && rawKey !== "your-openrouter-api-key" ? rawKey : "";
  const openrouterModel = (config.openrouterModel || process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash-lite").trim();

  if (openrouterKey) {
    try {
      const openrouter = new OpenRouter({
        apiKey: openrouterKey,
      });

      const response = await openrouter.chat.send({
        chatRequest: {
          model: openrouterModel,
          messages: [
            {
              role: "system",
              content:
                "Anda adalah asisten PageIndex Tree Reasoning AI yang cerdas. Gunakan HANYA konteks dokumen pohon yang disediakan untuk menjawab pertanyaan pengguna dengan akurat, lugas, dan terstruktur. Sertakan sitasi nomor halaman dalam format [Halaman X] jika relevan. Selalu jawab dalam Bahasa Indonesia.",
            },
            {
              role: "user",
              content: `KONTEKS DOKUMEN POHON:\n${fullContext}\n\nPERTANYAAN PENGGUNA:\n${userQuery}`,
            },
          ],
          maxTokens: 2048,
        },
      });

      if ("choices" in response && response.choices && response.choices.length > 0) {
        const content = response.choices[0]?.message?.content;
        if (typeof content === "string") {
          answer = content;
        } else if (Array.isArray(content)) {
          answer = content
            .map((c) => (typeof c === "string" ? c : "text" in c ? c.text : ""))
            .join("");
        } else {
          answer = "Tidak ada respons dari model OpenRouter.";
        }
      } else {
        answer = "Tidak ada respons dari model OpenRouter.";
      }
    } catch (err: unknown) {
      console.warn("Gagal memanggil OpenRouter API, beralih ke engine sintesis lokal:", err);
      answer = generateLocalSynthesis(userQuery, fullContext, citedPages, traversalPath);
    }
  } else {
    // Mode Heuristic Lokal (Bekerja langsung tanpa OpenRouter API Key)
    answer = generateLocalSynthesis(userQuery, fullContext, citedPages, traversalPath);
  }

  return {
    answer,
    traversalPath,
    citedPageNumbers: citedPages,
    visitedNodes,
  };
}

/**
 * Heuristic Scorer untuk mencocokkan query dengan ringkasan dan judul node dalam Tree
 */
function selectBestNode(
  query: string,
  candidateNodes: TreeNode[]
): TreeNode | null {
  if (candidateNodes.length === 0) return null;

  const queryTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  let bestNode: TreeNode = candidateNodes[0];
  let maxScore = -1;

  for (const node of candidateNodes) {
    let score = 0;
    const titleLower = node.title.toLowerCase();
    const summaryLower = node.summary.toLowerCase();
    const contentLower = (node.content || "").toLowerCase();

    for (const term of queryTerms) {
      if (titleLower.includes(term)) score += 10;
      if (summaryLower.includes(term)) score += 4;
      if (contentLower.includes(term)) score += 2;
    }

    if (score > maxScore) {
      maxScore = score;
      bestNode = node;
    }
  }

  return bestNode;
}

/**
 * Generator sintesis lokal berbasis konteks pohon jika API Key belum dipasang
 */
function generateLocalSynthesis(
  query: string,
  context: string,
  citedPages: number[],
  traversalPath: TraversalStep[]
): string {
  const pagesStr = citedPages.length > 0 ? citedPages.map((p) => `Halaman ${p}`).join(", ") : "Halaman 1";
  const finalStep = traversalPath[traversalPath.length - 1];

  // Bersihkan tag markdown khusus dari konteks
  const cleanContext = context.replace(/\[Sumber:.*?\]/g, "").trim();
  const preview = cleanContext.length > 400 ? cleanContext.substring(0, 400) + "..." : cleanContext;

  return `Berdasarkan penelusuran struktur pohon PageIndex pada bagian **${finalStep.title}** ([${pagesStr}]):\n\n${preview}\n\n> 💡 **Catatan PageIndex**: Jawaban di atas diekstrak langsung melalui navigasi pohon dokumen (*Tree Traversal*). Anda dapat memasukkan API Key OpenRouter di panel pengaturan untuk analisis generatif yang lebih mendalam.`;
}
