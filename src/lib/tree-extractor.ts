export interface ExtractedTreeNode {
  id?: string;
  title: string;
  level: number;
  nodeType: "root" | "chapter" | "section" | "page" | "chunk";
  summary: string;
  content?: string;
  pageNumber?: number;
  orderIndex: number;
  path?: string;
  children: ExtractedTreeNode[];
}

export interface ExtractedDocumentTree {
  title: string;
  fileType: string;
  totalPages: number;
  totalNodes: number;
  maxDepth: number;
  rootNode: ExtractedTreeNode;
}

/**
 * Memecah teks dokumen (Markdown / Teks terstruktur / PDF) menjadi hirarki PageIndex Tree
 */
export function parseDocumentToTree(
  filename: string,
  rawText: string,
  fileType: string = "markdown"
): ExtractedDocumentTree {
  const lines = rawText.split(/\r?\n/);
  const docTitle = cleanTitle(filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));

  // Root Node
  const rootNode: ExtractedTreeNode = {
    title: docTitle,
    level: 0,
    nodeType: "root",
    summary: `Dokumen utama: ${docTitle}. Berisi informasi lengkap dan terstruktur.`,
    orderIndex: 0,
    pageNumber: 1,
    children: [],
  };

  let currentChapter: ExtractedTreeNode | null = null;
  let currentSection: ExtractedTreeNode | null = null;
  let currentPageNumber = 1;
  let currentParagraphs: string[] = [];
  let chapterIndex = 0;
  let sectionIndex = 0;
  let pageIndex = 0;

  function flushCurrentContent() {
    if (currentParagraphs.length === 0) return;
    const contentText = currentParagraphs.join("\n\n").trim();
    if (!contentText) return;

    const pageSummary = generateSummaryFromText(contentText, 120);
    const leafNode: ExtractedTreeNode = {
      title: `Halaman ${currentPageNumber} - Konten`,
      level: currentSection ? 3 : currentChapter ? 2 : 1,
      nodeType: "page",
      summary: pageSummary,
      content: contentText,
      pageNumber: currentPageNumber,
      orderIndex: pageIndex++,
      children: [],
    };

    if (currentSection) {
      currentSection.children.push(leafNode);
    } else if (currentChapter) {
      currentChapter.children.push(leafNode);
    } else {
      rootNode.children.push(leafNode);
    }

    currentParagraphs = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Deteksi nomor halaman manual (misal: "--- Halaman 2 ---" atau "Page 2" atau "[Page 2]")
    const pageMatch = line.match(/(?:---\s*(?:Halaman|Page)\s*(\d+)\s*---|\[(?:Halaman|Page)\s*(\d+)\])/i);
    if (pageMatch) {
      flushCurrentContent();
      currentPageNumber = parseInt(pageMatch[1] || pageMatch[2], 10);
      continue;
    }

    // Deteksi Bab / Heading 1 (# Bab ...)
    const h1Match = line.match(/^#\s+(.+)$/) || line.match(/^(?:BAB|CHAPTER)\s+([IVXLCDM\d]+)[:.\s]+(.+)$/i);
    if (h1Match) {
      flushCurrentContent();
      const title = h1Match[2] ? `${h1Match[1] ? `Bab ${h1Match[1]}: ` : ""}${h1Match[2]}` : h1Match[1];
      currentChapter = {
        title: cleanTitle(title),
        level: 1,
        nodeType: "chapter",
        summary: `Bagian bab yang membahas mengenai ${cleanTitle(title)}.`,
        pageNumber: currentPageNumber,
        orderIndex: chapterIndex++,
        children: [],
      };
      rootNode.children.push(currentChapter);
      currentSection = null;
      continue;
    }

    // Deteksi Sub-bab / Heading 2 (## ...)
    const h2Match = line.match(/^##\s+(.+)$/) || line.match(/^(\d+\.\d+)\s+(.+)$/);
    if (h2Match) {
      flushCurrentContent();
      const title = h2Match[2] ? `${h2Match[1]} ${h2Match[2]}` : h2Match[1];
      currentSection = {
        title: cleanTitle(title),
        level: 2,
        nodeType: "section",
        summary: `Sub-bab yang memuat detail pembahasan tentang ${cleanTitle(title)}.`,
        pageNumber: currentPageNumber,
        orderIndex: sectionIndex++,
        children: [],
      };

      if (currentChapter) {
        currentChapter.children.push(currentSection);
      } else {
        rootNode.children.push(currentSection);
      }
      continue;
    }

    // Deteksi Sub-sub-bab / Heading 3 (### ...)
    const h3Match = line.match(/^###\s+(.+)$/) || line.match(/^(\d+\.\d+\.\d+)\s+(.+)$/);
    if (h3Match) {
      flushCurrentContent();
      const title = h3Match[2] ? `${h3Match[1]} ${h3Match[2]}` : h3Match[1];
      const subSection: ExtractedTreeNode = {
        title: cleanTitle(title),
        level: 3,
        nodeType: "section",
        summary: `Topik spesifik: ${cleanTitle(title)}.`,
        pageNumber: currentPageNumber,
        orderIndex: sectionIndex++,
        children: [],
      };

      if (currentSection) {
        currentSection.children.push(subSection);
      } else if (currentChapter) {
        currentChapter.children.push(subSection);
      } else {
        rootNode.children.push(subSection);
      }
      continue;
    }

    if (line.length > 0) {
      currentParagraphs.push(line);
    } else if (currentParagraphs.length > 5) {
      // Pecah halaman jika paragraf sudah cukup panjang
      flushCurrentContent();
      currentPageNumber++;
    }
  }

  flushCurrentContent();

  // Jika dokumen tidak memiliki heading eksplisit, buat struktur berbasis halaman/bagian
  if (rootNode.children.length === 0 && rawText.trim().length > 0) {
    const chunks = splitIntoParagraphChunks(rawText, 500);
    chunks.forEach((chunk, idx) => {
      const pageNum = idx + 1;
      rootNode.children.push({
        title: `Bagian ${pageNum} (Halaman ${pageNum})`,
        level: 1,
        nodeType: "page",
        summary: generateSummaryFromText(chunk, 120),
        content: chunk,
        pageNumber: pageNum,
        orderIndex: idx,
        children: [],
      });
    });
  }

  // Hitung total node dan kedalaman maksimal
  let totalNodes = 0;
  let maxDepth = 0;
  let maxPage = currentPageNumber;

  function enrichTreeMeta(node: ExtractedTreeNode, currentPath: string, depth: number) {
    totalNodes++;
    if (depth > maxDepth) maxDepth = depth;
    node.path = currentPath;

    // Perbarui summary parent jika anak-anaknya memiliki ringkasan
    if (node.children.length > 0) {
      const childSummaries = node.children.map((c) => c.title).slice(0, 5).join(", ");
      node.summary = `${node.title}: Mencakup topik (${childSummaries}).`;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.pageNumber && child.pageNumber > maxPage) {
          maxPage = child.pageNumber;
        }
        enrichTreeMeta(child, `${currentPath}/${child.orderIndex}`, depth + 1);
      }
    }
  }

  enrichTreeMeta(rootNode, "root", 0);
  rootNode.summary = `Dokumen '${docTitle}' dengan total ${totalNodes} node dan mencakup ${rootNode.children.length} bab/bagian utama.`;

  return {
    title: docTitle,
    fileType,
    totalPages: maxPage,
    totalNodes,
    maxDepth,
    rootNode,
  };
}

function cleanTitle(str: string): string {
  return str.replace(/[#*`_]/g, "").trim();
}

function generateSummaryFromText(text: string, maxLength: number = 150): string {
  const clean = text.replace(/[\n\r]+/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return clean.substring(0, maxLength).trim() + "...";
}

function splitIntoParagraphChunks(text: string, maxWords: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
  }
  return chunks;
}
