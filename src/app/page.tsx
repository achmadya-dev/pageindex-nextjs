"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar, { DocumentListItem } from "@/components/Navbar";
import TreeVisualizer from "@/components/TreeVisualizer";
import ChatInterface from "@/components/ChatInterface";
import NodeDetailDrawer from "@/components/NodeDetailDrawer";
import UploadModal from "@/components/UploadModal";
import SettingsModal from "@/components/SettingsModal";
import { NestedTreeNode } from "@/app/api/documents/[id]/tree/route";
import { Database, BookOpen, Sparkles } from "lucide-react";

export default function HomePage() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<NestedTreeNode | null>(null);
  const [allNodesList, setAllNodesList] = useState<NestedTreeNode[]>([]);
  const [traversedNodeIds, setTraversedNodeIds] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<NestedTreeNode | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Ambil daftar dokumen saat load pertama
  const fetchDocuments = useCallback(async (selectId?: string) => {
    try {
      setIsLoadingDocs(true);
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (data.success && data.documents) {
        setDocuments(data.documents);
        if (data.documents.length > 0) {
          const targetId = selectId || data.documents[0].id;
          setSelectedDocId(targetId);
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data dokumen:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadDocs() {
      try {
        const res = await fetch("/api/documents");
        const data = await res.json();
        if (!ignore && data.success && data.documents) {
          setDocuments(data.documents);
          if (data.documents.length > 0) {
            setSelectedDocId(data.documents[0].id);
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data dokumen:", err);
      } finally {
        if (!ignore) setIsLoadingDocs(false);
      }
    }
    loadDocs();
    return () => {
      ignore = true;
    };
  }, []);

  // Ambil struktur pohon untuk dokumen yang dipilih
  useEffect(() => {
    if (!selectedDocId) {
      const timer = setTimeout(() => {
        setTreeData(null);
        setAllNodesList([]);
        setSelectedNode(null);
        setTraversedNodeIds([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    let ignore = false;
    async function loadTreeData() {
      try {
        setIsLoadingTree(true);
        const res = await fetch(`/api/documents/${selectedDocId}/tree`);
        const data = await res.json();
        if (ignore) return;
        if (data.success && data.tree) {
          setTreeData(data.tree);
          setAllNodesList(data.allNodes || []);
          setSelectedNode(null);
          setTraversedNodeIds([]);
        } else {
          setTreeData(null);
        }
      } catch (err) {
        console.error("Gagal memuat pohon dokumen:", err);
        if (!ignore) setTreeData(null);
      } finally {
        if (!ignore) setIsLoadingTree(false);
      }
    }

    loadTreeData();
    return () => {
      ignore = true;
    };
  }, [selectedDocId]);

  // Handle seed dokumen demo
  const handleSeedDemo = async () => {
    try {
      setIsSeeding(true);
      const res = await fetch("/api/documents/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchDocuments();
      }
    } catch (err) {
      console.error("Gagal memuat demo:", err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSelectNodeById = (nodeId: string) => {
    const found = allNodesList.find((n) => n.id === nodeId);
    if (found) {
      setSelectedNode(found);
    }
  };

  const activeDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-700 dark:selection:bg-cyan-500/30 dark:selection:text-cyan-200 transition-colors duration-200">
      {/* Dynamic Ambient Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-cyan-500/10 dark:bg-cyan-600/10 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 dark:bg-emerald-600/10 blur-3xl" />
      </div>

      {/* Top Navigation */}
      <Navbar
        documents={documents}
        selectedDocumentId={selectedDocId}
        onSelectDocument={(id) => setSelectedDocId(id)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSeedDemo={handleSeedDemo}
        isSeeding={isSeeding}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-3.5">
        {/* Info Ribbon */}
        {activeDoc && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 backdrop-blur-md shadow-2xs text-xs transition-colors">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 font-bold">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="truncate max-w-xs">{activeDoc.title}</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                {activeDoc.totalPages} Halaman
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                {activeDoc.totalNodes} Node Tree
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                Kedalaman Max: Level {activeDoc.maxDepth}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                <Database className="w-3 h-3" />
                <span>PostgreSQL</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="flex items-center gap-1 text-indigo-700 dark:text-indigo-400 font-medium">
                <Sparkles className="w-3 h-3" />
                <span>PageIndex Reasoning</span>
              </span>
            </div>
          </div>
        )}

        {/* Split Screen Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 h-[calc(100vh-10.5rem)] min-h-145">
          {/* Left Panel: Tree Visualizer & Node Detail (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3 h-full">
            <div className={`h-full ${selectedNode ? "h-1/2" : "h-full"} transition-all duration-300`}>
              <TreeVisualizer
                key={treeData?.id || "empty-tree"}
                tree={treeData}
                traversedNodeIds={traversedNodeIds}
                selectedNode={selectedNode}
                onSelectNode={(node) => setSelectedNode(node)}
                isLoading={isLoadingTree || isLoadingDocs}
              />
            </div>

            {selectedNode && (
              <div className="h-1/2 transition-all duration-300 animate-in fade-in zoom-in-95">
                <NodeDetailDrawer
                  node={selectedNode}
                  onClose={() => setSelectedNode(null)}
                />
              </div>
            )}
          </div>

          {/* Right Panel: Chatbot with Reasoning Path (7 cols) */}
          <div className="lg:col-span-7 h-full">
            <ChatInterface
              documentId={selectedDocId}
              documentTitle={activeDoc?.title || "Dokumen"}
              onTraversalHighlight={(ids) => setTraversedNodeIds(ids)}
              onSelectNodeById={handleSelectNodeById}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(newDocId) => {
          fetchDocuments(newDocId);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={() => {}}
      />
    </div>
  );
}
