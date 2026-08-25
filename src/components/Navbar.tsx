"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Settings,
  FileText,
  ChevronDown,
  Layers,
  RefreshCw,
  Sun,
  Moon,
  Search,
  Check,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

export interface DocumentListItem {
  id: string;
  title: string;
  filename: string;
  fileType: string;
  fileSize: number;
  totalPages: number;
  totalNodes: number;
  maxDepth: number;
  createdAt: string;
}

interface NavbarProps {
  documents: DocumentListItem[];
  selectedDocumentId: string | null;
  onSelectDocument: (id: string) => void;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onSeedDemo: () => void;
  isSeeding?: boolean;
}

export default function Navbar({
  documents,
  selectedDocumentId,
  onSelectDocument,
  onOpenUpload,
  onOpenSettings,
  onSeedDemo,
  isSeeding,
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentDoc = documents.find((d) => d.id === selectedDocumentId);

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(docSearch.toLowerCase()) ||
    doc.filename.toLowerCase().includes(docSearch.toLowerCase())
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/85 dark:bg-slate-950/80 backdrop-blur-xl transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 gap-3">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-900 dark:bg-slate-950">
              <Layers className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                PageIndex<span className="text-cyan-600 dark:text-cyan-400">.ai</span>
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PostgreSQL Tree
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Hierarchical Tree Navigation & Reasoning
            </p>
          </div>
        </div>

        {/* Center: Document Selector Dropdown */}
        <div className="relative flex-1 max-w-md hidden md:block" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/90 px-3.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-cyan-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="truncate font-semibold">
                {currentDoc ? currentDoc.title : "Pilih Dokumen..."}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {currentDoc && (
                <span className="text-[10px] font-mono font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/70 px-2 py-0.5 rounded-md border border-cyan-300 dark:border-cyan-500/30">
                  {currentDoc.totalNodes} Nodes
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-2 w-full min-w-80 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95">
              <div className="p-1.5 border-b border-slate-100 dark:border-white/5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    placeholder="Cari dokumen tersimpan..."
                    className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    autoFocus
                  />
                </div>
              </div>

              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Dokumen PostgreSQL ({filteredDocs.length})
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 py-1">
                {filteredDocs.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Tidak ada dokumen yang sesuai.
                  </div>
                ) : (
                  filteredDocs.map((doc) => {
                    const isSelected = doc.id === selectedDocumentId;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => {
                          onSelectDocument(doc.id);
                          setDropdownOpen(false);
                          setDocSearch("");
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/40 text-indigo-900 dark:text-white"
                            : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold truncate">{doc.title}</p>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            {doc.totalPages} Hlm • {doc.totalNodes} Node Tree • Lv.{doc.maxDepth}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions & Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Ganti ke Light Mode" : "Ganti ke Dark Mode"}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform -rotate-12 hover:rotate-0" />
            )}
          </button>

          {/* Demo Button */}
          <button
            onClick={onSeedDemo}
            disabled={isSeeding}
            title="Muat Ulang Data Dokumen Contoh"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${isSeeding ? "animate-spin" : ""}`} />
            <span>Dokumen Demo</span>
          </button>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Dokumen</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="Pengaturan AI & Model API Key"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
