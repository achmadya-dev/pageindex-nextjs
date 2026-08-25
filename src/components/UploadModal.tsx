"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (documentId: string) => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsUploading(true);

    try {
      let res: Response;

      if (activeTab === "file") {
        if (!file) {
          setErrorMsg("Silakan pilih file terlebih dahulu.");
          setIsUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", file);
        if (title.trim()) formData.append("title", title.trim());

        res = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });
      } else {
        if (!textContent.trim()) {
          setErrorMsg("Konten teks tidak boleh kosong.");
          setIsUploading(false);
          return;
        }

        res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || "Dokumen Kustom",
            content: textContent,
            fileType: "markdown",
            filename: `${(title.trim() || "dokumen").toLowerCase().replace(/\s+/g, "-")}.md`,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengunggah dan memproses dokumen.");
      }

      onSuccess(data.document.id);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat memproses dokumen.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl transition-colors duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-tr from-cyan-600 to-indigo-600 text-white shadow-md">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ekstraksi Pohon Dokumen</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Parsing file menjadi struktur hirarki Bab, Sub-bab, & Halaman
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 mb-5 border border-slate-200 dark:border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "file"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Upload File (PDF / Markdown / TXT)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "text"
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Paste Teks / Markdown
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Judul Dokumen (Opsional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Dokumen Regulasi AI 2026"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-2xs"
            />
          </div>

          {activeTab === "file" ? (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.md,.txt,.markdown"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                  file
                    ? "border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-500/5"
                    : "border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/60 hover:border-cyan-500/60 hover:bg-slate-100 dark:hover:bg-slate-950"
                }`}
              >
                {file ? (
                  <div className="flex flex-col items-center text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{file.name}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB — Klik untuk mengganti file
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <FileText className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mb-2" />
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Klik atau seret file PDF / MD / TXT ke sini
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Maksimal ukuran file 15 MB
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Konten Markdown / Teks
              </label>
              <textarea
                rows={6}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder={`# Bab 1: Pendahuluan\n---\nIsi pembahasan...\n\n## 1.1 Latar Belakang\nDetail penjelasan...`}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-2xs"
              />
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-linear-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 rounded-xl shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Memproses Struktur Pohon...</span>
                </>
              ) : (
                <span>Ekstrak & Simpan ke PostgreSQL</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
