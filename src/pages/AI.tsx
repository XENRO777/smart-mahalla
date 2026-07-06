import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/lib/api";
import { getErrorMessage } from "@/lib/api";
import { StatusPill } from "@/components/shared/StatusPill";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// ──────────────────────────────────────────────
// Suggested questions (platform-specific)
// ──────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  "Qanday ariza topshiraman?",
  "Tokenlar nima va qanday olish mumkin?",
  "Arizam qanday holatda ekanligini qayerdan bilsam bo'ladi?",
  "Hokimiyat arizalarni qanday nazorat qiladi?",
  "KPI reytingi nima?",
  "Men qaysi mahallaga tegishliman?",
];

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export default function AI() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        `Assalomu alaykum, ${user?.full_name ?? "foydalanuvchi"}! ` +
        "Men **Freebuf AI** — SmartMahalla platformasining rasmiy aqlli yo'lko'rsatuvchisiman. " +
        "Quyidagi mavzularda yordam bera olaman:\n\n" +
        "• 📋 **Murojaatlar** — ariza topshirish va ularning holati\n" +
        "• 🪙 **Tokenlar** — mukofot tizimi haqida ma'lumot\n" +
        "• 📊 **KPI** — mahallalar reytingi\n" +
        "• 👥 **Aholi** — fuqarolar ro'yxati\n" +
        "• 👤 **Xodimlar** — mahalla xodimlari\n\n" +
        "Qanday yordam kerak? SAVOLINGIZNI YOZING.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [suggested, setSuggested] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Send message to AI backend ──────────────────────────────
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    // Hide suggestions after first message
    setSuggested(false);

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    // Build history for context (last 10 messages)
    const history = messages
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await apiClient.post("/ai/chat", {
        message: trimmed,
        history,
      });

      const reply: string = res.data?.data?.reply ?? "Javob olishda xatolik yuz berdi.";

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: reply.replace(/^\[(.+?)\]$/gm, "").trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Xatolik yuz berdi: ${getErrorMessage(err, "Server bilan bog'lanib bo'lmadi.")}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  // ── Handle Enter key ────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Clear chat ──────────────────────────────────────────────
  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content:
          "Assalomu alaykum! Men **Freebuf AI** — SmartMahalla platformasining " +
          "rasmiy aqlli yo'lko'rsatuvchisiman. Qanday yordam bera olaman?",
        timestamp: Date.now(),
      },
    ]);
    setSuggested(true);
  };

  return (
    <>
      <PageHeader
        title="Freebuf AI — Aqlli Yordamchi"
        description="SmartMahalla platformasi bo'yicha savollaringizga javob oling"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Yangilash
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 h-[calc(100vh-12rem)]">
        {/* ─── Chat area ─────────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {/* Avatar */}
                    {msg.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-primary text-white shadow-sm">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-accent/50 text-foreground rounded-tl-sm border border-border/50"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none">
                          {msg.content.split("\n").map((line, i) => (
                            <p key={i} className={i > 0 ? "mt-2" : ""}>
                              {line}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                      <p
                        className={`mt-1 text-[10px] ${
                          msg.role === "user"
                            ? "text-primary-foreground/60"
                            : "text-muted-foreground/60"
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString("uz-UZ", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Avatar */}
                    {msg.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground shadow-sm">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading indicator */}
                {sending && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-primary text-white shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-xl rounded-tl-sm bg-accent/50 border border-border/50 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Freebuf AI javob yozmoqda...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Savolingizni yozing va Enter bosing..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  className="flex-1 bg-secondary/40 border-0"
                />
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || sending}
                  className="gradient-primary border-0 text-white shadow-sm"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground/60 text-center">
                Freebuf AI — SmartMahalla platformasining rasmiy yordamchisi. 
                Ollama orqali ishlaydi (hozirda test rejimi).
              </p>
            </div>
          </Card>
        </div>

        {/* ─── Suggested questions sidebar ───────────────────────── */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Taklif qilingan savollar
              </div>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs h-auto py-2 px-3 whitespace-normal text-left leading-snug"
                  onClick={() => {
                    setInput(q);
                    sendMessage(q);
                  }}
                  disabled={sending}
                >
                  {q}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <AlertCircle className="h-4 w-4 text-info" />
                Platforma bo'limlari
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p><StatusPill status="Yangi" /> Murojaatlar</p>
                <p><StatusPill status="Faol" /> Tokenlar</p>
                <p><StatusPill status="Jarayonda" /> KPI</p>
                <p><StatusPill status="Hal qilindi" /> Aholi</p>
                <p><StatusPill status="Rad etildi" /> Xodimlar</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
