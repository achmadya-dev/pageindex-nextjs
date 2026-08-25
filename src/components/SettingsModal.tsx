"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Key, CheckCircle, ShieldAlert, Cpu } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: {
    openrouterKey: string;
    openrouterModel: string;
  }) => void;
}

export default function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [openrouterModel, setOpenrouterModel] = useState("google/gemini-2.0-flash-001");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const savedOpenrouterKey = localStorage.getItem("pageindex_openrouter_key") || "";
      const savedOpenrouterModel = localStorage.getItem("pageindex_openrouter_model") || "google/gemini-2.0-flash-001";

      const timer = setTimeout(() => {
        setOpenrouterKey(savedOpenrouterKey);
        setOpenrouterModel(savedOpenrouterModel);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("pageindex_openrouter_key", openrouterKey);
      localStorage.setItem("pageindex_openrouter_model", openrouterModel);
      // Bersihkan key legacy
      localStorage.removeItem("pageindex_provider");
      localStorage.removeItem("pageindex_gemini_key");
      localStorage.removeItem("pageindex_openai_key");
    }
    if (onSave) {
      onSave({ openrouterKey, openrouterModel });
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const openRouterModels = [
    { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite (Super Cepat & Hemat)" },
    { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash (Cepat & Akurat)" },
    { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B (Open Weights)" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (Penalaran Kompleks)" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini (Hemat Biaya)" },
    { id: "deepseek/deepseek-chat", name: "DeepSeek V3" },
  ];

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
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pengaturan Model & API Key</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Konfigurasi OpenRouter untuk penalaran cerdas PageIndex Tree
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5 p-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Key className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                OpenRouter API Key
              </label>
              <input
                type="password"
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono shadow-2xs"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Dapatkan API Key di <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-cyan-600 dark:text-cyan-400 font-medium hover:underline">openrouter.ai/keys</a>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Pilih Model LLM
              </label>
              <select
                value={openRouterModels.some((m) => m.id === openrouterModel) ? openrouterModel : "custom"}
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    setOpenrouterModel(e.target.value);
                  }
                }}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none shadow-2xs"
              >
                {openRouterModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </option>
                ))}
                <option value="custom">Kustom Model (Ketik nama model manual)</option>
              </select>

              <input
                type="text"
                value={openrouterModel}
                onChange={(e) => setOpenrouterModel(e.target.value)}
                placeholder="Contoh: google/gemini-2.0-flash-001"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:border-cyan-500 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          <div className="rounded-xl border border-cyan-200 dark:border-cyan-500/20 bg-cyan-50 dark:bg-cyan-500/5 p-3 flex gap-2.5 items-start">
            <ShieldAlert className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-cyan-900 dark:text-cyan-300/90 leading-relaxed">
              Jika API key tidak diisi, sistem otomatis menjalankan <strong>Local Tree Traversal Reasoning Engine</strong> bawaan untuk mengekstrak jawaban akurat langsung dari simpul pohon PostgreSQL.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-md shadow-cyan-600/25 transition-all"
            >
              {isSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <span>Simpan Pengaturan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
