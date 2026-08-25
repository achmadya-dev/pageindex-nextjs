"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Loader2,
  Compass,
  ArrowRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TraversalStep } from "@/lib/pageindex-reasoning";

function generateMessageId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

export interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  traversalPath?: TraversalStep[];
  citedPageNumbers?: number[];
  visitedNodes?: { id: string; title: string; level: number; pageNumber: number | null }[];
  timestamp?: Date;
}

interface ChatInterfaceProps {
  documentId: string | null;
  documentTitle: string;
  onTraversalHighlight: (nodeIds: string[]) => void;
  onSelectNodeById?: (nodeId: string) => void;
}

export default function ChatInterface({
  documentId,
  documentTitle,
  onTraversalHighlight,
  onSelectNodeById,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [openTraversalIndex, setOpenTraversalIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history when document changes
  useEffect(() => {
    if (!documentId) {
      const timer = setTimeout(() => {
        setMessages([]);
        setSessionId(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    let isMounted = true;

    async function loadHistory() {
      try {
        const res = await fetch(`/api/chat/history?documentId=${documentId}`);
        const data = await res.json();
        if (!isMounted) return;

        if (data.success && data.sessions && data.sessions.length > 0) {
          const latestSession = data.sessions[0];
          setSessionId(latestSession.id);

          const msgRes = await fetch(`/api/chat/history?sessionId=${latestSession.id}`);
          const msgData = await msgRes.json();
          if (!isMounted) return;

          if (msgData.success && msgData.messages) {
            setMessages(
              msgData.messages.map((m: { id: string; role: "user" | "assistant"; content: string; traversalPath?: TraversalStep[]; citedPageNumbers?: number[] }) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                traversalPath: m.traversalPath,
                citedPageNumbers: m.citedPageNumbers,
              }))
            );
          }
        } else {
          setMessages([]);
          setSessionId(null);
        }
      } catch (err) {
        console.warn("Gagal memuat riwayat percakapan:", err);
      }
    }

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [documentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (queryText?: string) => {
    const text = queryText || inputValue;
    if (!text.trim() || !documentId || isLoading) return;

    const userMessage: MessageItem = {
      id: generateMessageId("user"),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const openrouterApiKey = typeof window !== "undefined" ? localStorage.getItem("pageindex_openrouter_key") || "" : "";
      const openrouterModel = typeof window !== "undefined" ? localStorage.getItem("pageindex_openrouter_model") || "" : "";

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          query: text,
          sessionId,
          openrouterApiKey,
          openrouterModel,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mendapatkan respons dari PageIndex AI.");
      }

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }

      const assistantMessage: MessageItem = {
        id: data.messageId || generateMessageId("asst"),
        role: "assistant",
        content: data.answer,
        traversalPath: data.traversalPath,
        citedPageNumbers: data.citedPageNumbers,
        visitedNodes: data.visitedNodes,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.traversalPath && data.traversalPath.length > 0) {
        const visitedIds = data.traversalPath.map((step: TraversalStep) => step.nodeId);
        onTraversalHighlight(visitedIds);
        setOpenTraversalIndex(messages.length + 1);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses pertanyaan.";
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId("err"),
          role: "assistant",
          content: `⚠️ **Maaf, terjadi kesalahan:** ${errorMsg}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setSessionId(null);
    onTraversalHighlight([]);
  };

  const suggestions = getSampleSuggestions(documentTitle);

  return (
    <div className="flex h-full flex-col bg-white/80 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-white/5 overflow-hidden backdrop-blur-md shadow-xs transition-colors duration-200">
      {/* Chat Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-slate-900/60 p-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-tr from-cyan-500 to-indigo-600 text-white shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              PageIndex Reasoning Assistant
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Penalaran pohon hirarki PostgreSQL & sitasi halaman
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleResetChat}
            title="Mulai Percakapan Baru"
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-4 sm:p-6 space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/5">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Tanyakan Apapun tentang Dokumen
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
                PageIndex AI menelusuri struktur pohon Bab, Sub-bab, dan Halaman dokumen secara bertingkat untuk menyusun jawaban akurat beserta referensi nomor halaman.
              </p>
            </div>

            {/* Quick Suggestion Chips */}
            {suggestions.length > 0 && (
              <div className="w-full max-w-md space-y-2 pt-2 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Contoh Pertanyaan:
                </p>
                <div className="flex flex-col gap-1.5">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(s)}
                      className="group flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30 p-2.5 rounded-xl transition-all shadow-2xs text-left"
                    >
                      <span className="truncate pr-2">{s}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              } space-y-1.5`}
            >
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 px-1 font-medium">
                {msg.role === "user" ? (
                  <>
                    <span>Anda</span>
                    <User className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>PageIndex Agent</span>
                  </>
                )}
              </div>

              <div
                className={`max-w-[92%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-linear-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-indigo-600/15 rounded-tr-sm"
                    : "bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 border border-slate-200/90 dark:border-white/10 rounded-tl-sm shadow-md"
                }`}
              >
                {/* Reasoning Traversal Steps Accordion for Assistant */}
                {msg.role === "assistant" && msg.traversalPath && msg.traversalPath.length > 0 && (
                  <div className="mb-3.5 rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/20 p-2.5">
                    <button
                      onClick={() =>
                        setOpenTraversalIndex(openTraversalIndex === index ? null : index)
                      }
                      className="flex w-full items-center justify-between text-left text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200"
                    >
                      <div className="flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Jejak Penalaran Pohon ({msg.traversalPath.length} Langkah Traversal)</span>
                      </div>
                      {openTraversalIndex === index ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {openTraversalIndex === index && (
                      <div className="mt-2.5 space-y-2 border-t border-emerald-200 dark:border-emerald-500/20 pt-2 text-[11px]">
                        {msg.traversalPath.map((step) => (
                          <div
                            key={step.step}
                            onClick={() => onSelectNodeById && onSelectNodeById(step.nodeId)}
                            className="group flex items-start gap-2 rounded-lg bg-white/90 dark:bg-slate-950/60 p-2 border border-slate-200 dark:border-white/5 hover:border-emerald-400 dark:hover:border-emerald-500/40 cursor-pointer transition-all shadow-2xs"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                              {step.step}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 truncate">
                                  {step.title}
                                </span>
                                {step.pageNumber && (
                                  <span className="text-[9px] font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/50 px-1.5 py-0.2 rounded font-medium">
                                    Hal. {step.pageNumber}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                                {step.reason}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Markdown Message Content */}
                <div className="prose prose-xs dark:prose-invert max-w-none space-y-1.5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Cited Pages Footer */}
                {msg.citedPageNumbers && msg.citedPageNumbers.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-200 dark:border-white/10 pt-2.5">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      <BookOpen className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                      Sitasi Halaman:
                    </span>
                    {msg.citedPageNumbers.map((pageNum) => (
                      <span
                        key={pageNum}
                        className="text-[10px] font-mono font-semibold bg-cyan-100 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 px-2 py-0.5 rounded-md"
                      >
                        Halaman {pageNum}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex flex-col items-start space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 px-1 font-medium">
              <Bot className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>PageIndex Agent</span>
            </div>
            <div className="bg-white dark:bg-slate-900/90 rounded-2xl rounded-tl-sm p-4 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 flex items-center gap-3 shadow-md">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="animate-pulse font-medium">
                Menjelajahi struktur pohon dokumen & merangkai jawaban terverifikasi...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar Form */}
      <div className="border-t border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-slate-900/80 p-3 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={!documentId || isLoading}
            placeholder={
              documentId
                ? "Tanyakan sesuatu tentang dokumen ini (misal: 'Jelaskan bab 1')..."
                : "Silakan pilih atau unggah dokumen terlebih dahulu..."
            }
            className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 shadow-2xs transition-colors"
          />

          <button
            type="submit"
            disabled={!documentId || !inputValue.trim() || isLoading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-indigo-600/25 hover:from-cyan-500 hover:to-indigo-500 transition-all disabled:opacity-40 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function getSampleSuggestions(docTitle: string): string[] {
  if (docTitle.toLowerCase().includes("ai") || docTitle.toLowerCase().includes("etika")) {
    return [
      "Apa 4 kategori klasifikasi risiko sistem AI menurut regulasi?",
      "Apa syarat teknis wajib bagi sistem AI kategori Risiko Tinggi?",
      "Bagaimana kebijakan mengenai data latih hak cipta dan data pribadi?",
    ];
  }

  if (docTitle.toLowerCase().includes("cloud") || docTitle.toLowerCase().includes("keamanan")) {
    return [
      "Apa standar enkripsi data in-transit dan at-rest yang diwajibkan?",
      "Jelaskan prinsip Zero Trust Architecture (ZTA) yang diterapkan.",
      "Berapa target RPO dan RTO yang ditetapkan untuk Disaster Recovery?",
    ];
  }

  return [
    "Apa ringkasan topik utama dari dokumen ini?",
    "Jelaskan poin-poin penting pada Bab pertama.",
  ];
}
