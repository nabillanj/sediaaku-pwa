"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { sendMessage, pollMessages, reportMessage } from "@/lib/actions/chat";
import type { Message, RelatedOrder } from "@/lib/actions/chat";

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const DAYS_FULL = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDateSep(iso: string): string {
  const d = new Date(iso);
  return `${DAYS_FULL[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function sameDay(a: unknown, b: unknown): boolean {
  if (!a || !b) return false;
  return new Date(a as string).toISOString().slice(0, 10) ===
         new Date(b as string).toISOString().slice(0, 10);
}

function orderStatusLabel(status: string): string {
  const m: Record<string, string> = {
    confirmed: "Dikonfirmasi",
    on_the_way: "Perjalanan",
    arrived: "Tiba",
    in_progress: "Sedang berlangsung",
    completed: "Selesai",
  };
  return m[status] ?? status;
}

function formatOrderBanner(order: RelatedOrder): string {
  const d = new Date(order.scheduled_date);
  const dayShort = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"][d.getDay()];
  const dateStr = `${dayShort} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const start = order.start_time.slice(0, 5);
  const end = order.end_time.slice(0, 5);
  return `${dateStr} · ${start}–${end} · ${orderStatusLabel(order.order_status)}`;
}

interface Props {
  conversationId: string;
  initialMessages: Message[];
  currentUid: string;
  currentRole: "user" | "partner";
  displayName: string;
  isOnline: boolean;
  isSupport?: boolean;
  relatedOrder: RelatedOrder | null;
  backHref: string;
}

export default function ChatDetailClient({
  conversationId,
  initialMessages,
  currentUid,
  currentRole,
  displayName,
  isOnline,
  isSupport = false,
  relatedOrder,
  backHref,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null); // message id
  const [reported, setReported] = useState<Set<string>>(new Set());
  const [reportDone, setReportDone] = useState(false);
  const [, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Poll for new messages every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      const lastTs = messages[messages.length - 1]?.created_at ?? new Date(0).toISOString();
      startTransition(async () => {
        const fresh = await pollMessages(conversationId, currentUid, lastTs);
        if (fresh.length > 0) {
          setMessages((prev) => [...prev, ...fresh]);
        }
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId, currentUid, messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setInput("");

    // Optimistic update
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      conversation_id: conversationId,
      sender_uid: currentUid,
      sender_role: currentRole,
      body: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const res = await sendMessage(conversationId, currentUid, currentRole, trimmed);
    if (res.ok && res.message) {
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? res.message! : m));
    }
    setSending(false);
    inputRef.current?.focus();
  }

  async function handleReport(messageId: string) {
    await reportMessage(messageId, currentUid);
    setReported((prev) => new Set([...prev, messageId]));
    setMenuFor(null);
    setReportDone(true);
    setTimeout(() => setReportDone(false), 3000);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="pwa-shell" onClick={() => setMenuFor(null)}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 20px", position: "sticky", top: 0,
        background: "var(--bg)", zIndex: 10, flexShrink: 0,
      }}>
        <Link href={backHref} style={{ textDecoration: "none" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11, background: "var(--surface-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </div>
        </Link>

        <div style={{ position: "relative", flexShrink: 0 }}>
          {isSupport ? (
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "#e8f5f3",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              <img src="/logo.png" alt="Tim Sediaaku" style={{ width: 28, height: 28, objectFit: "contain" }} />
            </div>
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--primary-100)", color: "var(--primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700,
            }}>
              {displayName[0]?.toUpperCase()}
            </div>
          )}
          {isSupport ? (
            <span style={{
              position: "absolute", bottom: 0, right: 0,
              width: 14, height: 14, borderRadius: "50%",
              background: "var(--primary)", border: "2px solid var(--bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          ) : isOnline ? (
            <span style={{
              position: "absolute", bottom: 1, right: 1,
              width: 8, height: 8, borderRadius: "50%",
              background: "#22c55e", border: "2px solid var(--bg)",
            }} />
          ) : null}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>{displayName}</div>
          <div style={{ fontSize: 11, color: isOnline ? "#22c55e" : "var(--text-3)" }}>
            {isOnline ? "Online sekarang" : "Offline"}
          </div>
        </div>
      </div>

      {/* Related order banner */}
      {relatedOrder && (
        <Link href={`/orders/${relatedOrder.id}`} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px",
          background: "var(--primary-50)",
          borderBottom: "1px solid var(--primary-100)",
          textDecoration: "none",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: "var(--primary-700)", fontWeight: 500 }}>
            {formatOrderBanner(relatedOrder)}
          </span>
          <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
            Lihat →
          </span>
        </Link>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
        {messages.map((msg, i) => {
          const isMine = msg.sender_uid === currentUid;
          const showDateSep = i === 0 || !sameDay(messages[i - 1]?.created_at, msg.created_at);
          const showTime = i === messages.length - 1 ||
            msg.sender_uid !== messages[i + 1]?.sender_uid ||
            !sameDay(msg.created_at, messages[i + 1]?.created_at);

          return (
            <div key={msg.id}>
              {showDateSep && (
                <div style={{
                  textAlign: "center", margin: "12px 0 8px",
                  fontSize: 11, color: "var(--text-3)",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  {formatDateSep(msg.created_at)}
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>
              )}

              <div style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
                marginBottom: showTime ? 6 : 2,
              }}>
                <div
                  style={{ position: "relative", maxWidth: "75%" }}
                  onContextMenu={(e) => { e.preventDefault(); setMenuFor(msg.id); }}
                >
                  <div
                    style={{
                      padding: "9px 13px",
                      borderRadius: isMine ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                      background: isMine ? "var(--primary)" : "var(--surface)",
                      color: isMine ? "#fff" : "var(--text-1)",
                      fontSize: 14, lineHeight: 1.5,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                      border: isMine ? "none" : "1px solid var(--border-soft)",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.body}
                  </div>

                  {/* Context menu */}
                  {menuFor === msg.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute",
                        [isMine ? "right" : "left"]: 0,
                        top: "100%", marginTop: 4, zIndex: 50,
                        background: "var(--surface)", borderRadius: 10,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                        border: "1px solid var(--border-soft)",
                        overflow: "hidden", minWidth: 140,
                      }}
                    >
                      <button
                        onClick={() => handleReport(msg.id)}
                        disabled={reported.has(msg.id)}
                        style={{
                          display: "block", width: "100%",
                          padding: "11px 16px", border: "none",
                          background: "transparent", cursor: "pointer",
                          fontSize: 13, color: reported.has(msg.id) ? "var(--text-3)" : "var(--danger)",
                          textAlign: "left", fontFamily: "inherit",
                        }}
                      >
                        {reported.has(msg.id) ? "Sudah dilaporkan" : "Laporkan pesan"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {showTime && (
                <div style={{
                  textAlign: isMine ? "right" : "left",
                  fontSize: 10, color: "var(--text-3)",
                  marginBottom: 6, paddingLeft: isMine ? 0 : 4,
                  paddingRight: isMine ? 4 : 0,
                }}>
                  {formatTime(msg.created_at)}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Toast */}
      {reportDone && (
        <div style={{
          position: "absolute", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: "rgba(15,31,29,0.88)", color: "#fff",
          borderRadius: 10, padding: "8px 16px", fontSize: 13,
          whiteSpace: "nowrap", zIndex: 100,
        }}>
          Pesan dilaporkan. Terima kasih!
        </div>
      )}

      {/* Input */}
      <div style={{
        display: "flex", alignItems: "flex-end", gap: 10,
        padding: "10px 16px 24px",
        background: "var(--surface)",
        borderTop: "1px solid var(--border-soft)",
        flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tulis pesan..."
          rows={1}
          style={{
            flex: 1, resize: "none", border: "1.5px solid var(--border)",
            borderRadius: 14, padding: "10px 14px",
            fontSize: 14, fontFamily: "inherit",
            background: "var(--surface-2)", color: "var(--text-1)",
            outline: "none", maxHeight: 120, lineHeight: 1.5,
          }}
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = "auto";
            t.style.height = Math.min(t.scrollHeight, 120) + "px";
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            width: 42, height: 42, borderRadius: 12,
            background: input.trim() ? "var(--primary)" : "var(--border)",
            border: "none", cursor: input.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "background 0.15s",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
