"use client";

import React, { useState } from "react";
import { X, FileText, Layers, Hash, BookOpen, Clock, Copy, Check, ChevronRight } from "lucide-react";
import { NestedTreeNode } from "@/app/api/documents/[id]/tree/route";

interface NodeDetailDrawerProps {
  node: NestedTreeNode | null;
  onClose: () => void;
}

export default function NodeDetailDrawer({ node, onClose }: NodeDetailDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!node) return null;

  const handleCopy = () => {
    const textToCopy = node.content || node.summary;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pathParts = node.path ? node.path.split("/").filter(Boolean) : [];

  return (
    <div className="flex flex-col h-full bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xl backdrop-blur-xl transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/60 p-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {node.title}
            </h3>
            {/* Breadcrumb Path */}
            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
              <span>root</span>
              {pathParts.map((p, i) => (
                <React.Fragment key={i}>
                  <ChevronRight className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                  <span className="truncate">{p}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Meta Pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/80 dark:border-white/5 bg-slate-50/40 dark:bg-slate-950/30 px-3.5 py-2">
        <div className="flex items-center gap-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/5">
          <Layers className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
          <span>Level {node.level}</span>
        </div>

        {node.pageNumber && (
          <div className="flex items-center gap-1 text-[10px] font-semibold bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-500/30">
            <BookOpen className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span>Halaman {node.pageNumber}</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/5">
          <Hash className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span className="capitalize">{node.nodeType}</span>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/5">
          <Clock className="w-3 h-3 text-violet-600 dark:text-violet-400" />
          <span>~{node.tokenCount} Tokens</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
        {/* Node Summary */}
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ringkasan Indeks Node
          </h4>
          <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950/60 p-3 text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
            {node.summary}
          </div>
        </div>

        {/* Full Text Content */}
        {node.content ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Isi Konten Dokumen
              </h4>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Tersalin" : "Salin Teks"}</span>
              </button>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-slate-950/80 p-3 font-mono text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
              {node.content}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-3 text-center text-[11px] text-slate-500">
            Node ini adalah container / induk hierarki yang merangkum node cabang di bawahnya.
          </div>
        )}
      </div>
    </div>
  );
}
