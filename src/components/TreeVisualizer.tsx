"use client";

import React, { useState, useMemo } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Layers,
  BookOpen,
  Search,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";
import { NestedTreeNode } from "@/app/api/documents/[id]/tree/route";

interface TreeVisualizerProps {
  tree: NestedTreeNode | null;
  traversedNodeIds: string[];
  selectedNode: NestedTreeNode | null;
  onSelectNode: (node: NestedTreeNode) => void;
  isLoading?: boolean;
}

export default function TreeVisualizer({
  tree,
  traversedNodeIds,
  selectedNode,
  onSelectNode,
  isLoading,
}: TreeVisualizerProps) {
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | "all">("all");

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setCollapsedNodeIds(new Set());
  };

  const collapseAll = () => {
    if (!tree) return;
    const allIds = new Set<string>();
    const collectIds = (node: NestedTreeNode) => {
      node.children.forEach((c) => {
        allIds.add(c.id);
        collectIds(c);
      });
    };
    collectIds(tree);
    setCollapsedNodeIds(allIds);
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-white/70 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-white/5 backdrop-blur-md">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mb-3" />
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Memuat Struktur Pohon dari PostgreSQL...
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Mengambil relasi hirarki Adjacency List & summary nodes
        </p>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-white/70 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-white/5 backdrop-blur-md">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 mb-3 text-slate-400">
          <Layers className="h-7 w-7 stroke-[1.5]" />
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Belum ada dokumen yang dipilih
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Pilih dokumen dari menu dropdown di atas atau unggah dokumen baru untuk melihat pohon hirarki.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white/80 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-white/5 overflow-hidden backdrop-blur-md shadow-xs transition-colors duration-200">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-slate-900/60 p-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              PageIndex Tree Hierarchy
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              PostgreSQL Adjacency List
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {traversedNodeIds.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 px-2 py-0.5 rounded-full mr-1 animate-pulse">
              <Sparkles className="w-3 h-3" />
              {traversedNodeIds.length} Traversed
            </span>
          )}

          <button
            onClick={expandAll}
            title="Buka Semua Cabang"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Expand</span>
          </button>
          <button
            onClick={collapseAll}
            title="Tutup Semua Cabang"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Minimize2 className="w-3 h-3" />
            <span>Collapse</span>
          </button>
        </div>
      </div>

      {/* Search & Level Filters */}
      <div className="p-2.5 border-b border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari node, topik bab, atau nomor halaman..."
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 pl-9 pr-8 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-[10px] font-medium text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Level Quick Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px]">
          <button
            onClick={() => setLevelFilter("all")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
              levelFilter === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5"
            }`}
          >
            Semua Tingkat
          </button>
          <button
            onClick={() => setLevelFilter(1)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
              levelFilter === 1
                ? "bg-cyan-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5"
            }`}
          >
            Level Bab
          </button>
          <button
            onClick={() => setLevelFilter(2)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
              levelFilter === 2
                ? "bg-violet-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5"
            }`}
          >
            Level Sub-Bab
          </button>
          <button
            onClick={() => setLevelFilter(3)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
              levelFilter === 3
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5"
            }`}
          >
            Level Halaman
          </button>
        </div>
      </div>

      {/* Tree Content Canvas */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <TreeNodeItem
          node={tree}
          level={0}
          collapsedNodeIds={collapsedNodeIds}
          traversedNodeIds={traversedNodeIds}
          selectedNodeId={selectedNode?.id || null}
          searchQuery={searchQuery}
          levelFilter={levelFilter}
          onToggleExpand={toggleExpand}
          onSelect={onSelectNode}
        />
      </div>
    </div>
  );
}

interface TreeNodeItemProps {
  node: NestedTreeNode;
  level: number;
  collapsedNodeIds: Set<string>;
  traversedNodeIds: string[];
  selectedNodeId: string | null;
  searchQuery: string;
  levelFilter: number | "all";
  onToggleExpand: (id: string, e: React.MouseEvent) => void;
  onSelect: (node: NestedTreeNode) => void;
}

function TreeNodeItem({
  node,
  level,
  collapsedNodeIds,
  traversedNodeIds,
  selectedNodeId,
  searchQuery,
  levelFilter,
  onToggleExpand,
  onSelect,
}: TreeNodeItemProps) {
  const isTraversed = traversedNodeIds.includes(node.id);
  const isExpanded = !collapsedNodeIds.has(node.id) || isTraversed;
  const isSelected = selectedNodeId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  // Search and Level Filter match
  const isMatchSearch = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      node.title.toLowerCase().includes(q) ||
      node.summary.toLowerCase().includes(q) ||
      (node.pageNumber && `halaman ${node.pageNumber}`.includes(q))
    );
  }, [node, searchQuery]);

  const isMatchLevel = levelFilter === "all" || node.level === levelFilter || level === 0;

  const levelBadgeInfo = getLevelBadge(node.level);

  // If node doesn't match filter and has no matching children, dim or hide
  const isVisible = isMatchSearch && isMatchLevel;

  return (
    <div className={`relative transition-opacity duration-200 ${!isVisible && !hasChildren ? "opacity-30" : ""}`}>
      {/* Node Row Card */}
      <div
        onClick={() => onSelect(node)}
        style={{ paddingLeft: `${Math.min(level * 16, 100) + 6}px` }}
        className={`group relative flex items-center justify-between gap-2 py-1.5 pr-2.5 rounded-xl transition-all cursor-pointer select-none ${
          isTraversed
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-500/50 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-400/40"
            : isSelected
            ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-white border border-indigo-300 dark:border-indigo-500/50 shadow-sm shadow-indigo-500/10 ring-1 ring-indigo-400/40"
            : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Expand/Collapse Caret */}
          {hasChildren ? (
            <button
              onClick={(e) => onToggleExpand(node.id, e)}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <div className="w-5 shrink-0" />
          )}

          {/* Node Icon */}
          <div className="shrink-0">
            {node.level === 0 ? (
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            ) : hasChildren ? (
              isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-slate-400" />
              )
            ) : (
              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>

          {/* Title & Summary preview */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`truncate text-xs ${
                  isTraversed
                    ? "font-bold text-emerald-700 dark:text-emerald-300"
                    : isSelected
                    ? "font-bold text-indigo-700 dark:text-white"
                    : "font-medium text-slate-800 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white"
                }`}
              >
                {node.title}
              </span>

              {isTraversed && (
                <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 px-1.5 py-0.2 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" />
                  Traversed
                </span>
              )}
            </div>

            <p className="truncate text-[10px] text-slate-500 dark:text-slate-400 max-w-72 mt-0.5">
              {node.summary}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1 shrink-0">
          {node.pageNumber && (
            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800/90 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20 px-1.5 py-0.5 rounded-md font-semibold">
              Hal. {node.pageNumber}
            </span>
          )}

          <span
            className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-md border ${levelBadgeInfo.className}`}
          >
            {levelBadgeInfo.label}
          </span>
        </div>
      </div>

      {/* Child Nodes */}
      {hasChildren && isExpanded && (
        <div className="relative mt-0.5 space-y-0.5">
          {/* Guide Line indicator */}
          <div
            style={{ left: `${Math.min(level * 16, 100) + 15}px` }}
            className="absolute top-0 bottom-2 w-px bg-slate-200 dark:bg-white/10"
          />
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              collapsedNodeIds={collapsedNodeIds}
              traversedNodeIds={traversedNodeIds}
              selectedNodeId={selectedNodeId}
              searchQuery={searchQuery}
              levelFilter={levelFilter}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getLevelBadge(level: number) {
  if (level === 0) {
    return {
      label: "Root",
      className: "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30",
    };
  }
  if (level === 1) {
    return {
      label: "Bab",
      className: "bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30",
    };
  }
  if (level === 2) {
    return {
      label: "Sub-Bab",
      className: "bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/30",
    };
  }
  return {
    label: "Page",
    className: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
  };
}
