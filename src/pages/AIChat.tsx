import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
  AlertCircle,
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftOpen,
  PanelLeftClose,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// -------------------------------------------------------------------
//  Types
// -------------------------------------------------------------------
interface Message {
  role: "user" | "ai";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

// -------------------------------------------------------------------
//  LocalStorage helpers
// -------------------------------------------------------------------
const STORAGE_KEY = "tourenvi_chat_history";

const loadConversations = (): Conversation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveConversations = (conversations: Conversation[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
};

// -------------------------------------------------------------------
//  Default greeting shown at the start of every new conversation
// -------------------------------------------------------------------
const DEFAULT_GREETING: Message = {
  role: "ai",
  content:
    "Hello! I'm your Tourenvi Travel Guide. I can help you with:\n\n• Detailed Tour Plans & Itineraries\n• Cost & Fuel Estimation\n• Best Places to Visit & Transport Routes\n• Cultural Tips & Local Communication\n\nWhere are you planning to go?",
};

// -------------------------------------------------------------------
//  Generate a short title from the first user message
// -------------------------------------------------------------------
const generateTitle = (firstMessage: string): string => {
  // Take the first ~50 chars and trim to last full word
  const trimmed = firstMessage.slice(0, 55);
  const lastSpace = trimmed.lastIndexOf(" ");
  const title = lastSpace > 30 ? trimmed.slice(0, lastSpace) : trimmed;
  return title + (firstMessage.length > 55 ? "…" : "");
};

// -------------------------------------------------------------------
//  Group conversations by date-label (Today / Yesterday / 7 Days / Older)
// -------------------------------------------------------------------
const groupByDate = (conversations: Conversation[]) => {
  const now = Date.now();
  const oneDay = 86_400_000;

  const groups: { label: string; items: Conversation[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 Days", items: [] },
    { label: "Older", items: [] },
  ];

  // Sort newest first
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  for (const c of sorted) {
    const age = now - c.updatedAt;
    if (age < oneDay) groups[0].items.push(c);
    else if (age < 2 * oneDay) groups[1].items.push(c);
    else if (age < 7 * oneDay) groups[2].items.push(c);
    else groups[3].items.push(c);
  }

  return groups.filter((g) => g.items.length > 0);
};

// ===================================================================
//  COMPONENT
// ===================================================================
const AIChat = () => {
  // --- All conversations & active conversation -----------------------
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadConversations()
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  // --- Current chat messages (the ones rendered) ---------------------
  const [messages, setMessages] = useState<Message[]>([DEFAULT_GREETING]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Sidebar -------------------------------------------------------
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Persist conversations whenever they change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // -------------------------------------------------------------------
  //  Helper – persist the current chat into conversations list
  // -------------------------------------------------------------------
  const persistChat = useCallback(
    (msgs: Message[], convId: string | null) => {
      setConversations((prev) => {
        // Find the first user message for title generation
        const firstUserMsg = msgs.find((m) => m.role === "user");
        const title = firstUserMsg
          ? generateTitle(firstUserMsg.content)
          : "New Chat";

        if (convId) {
          // Update existing conversation
          return prev.map((c) =>
            c.id === convId
              ? { ...c, messages: msgs, title, updatedAt: Date.now() }
              : c
          );
        } else {
          // Create a new conversation
          const newConv: Conversation = {
            id: crypto.randomUUID(),
            title,
            messages: msgs,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setActiveId(newConv.id);
          return [newConv, ...prev];
        }
      });
    },
    []
  );

  // -------------------------------------------------------------------
  //  Clean response text
  // -------------------------------------------------------------------
  const cleanResponseText = (text: string) =>
    text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "•")
      .replace(/#{1,3}/g, "");

  // -------------------------------------------------------------------
  //  Send message (with conversation context)
  // -------------------------------------------------------------------
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const systemInstruction = `
        You are an expert Tourist Guide AI for the Tourenvi app.
        Your ONLY purpose is to assist travelers with:
        - Tour structure and planning (day-by-day itineraries).
        - Detailed cost estimation (food, travel, stay) and fuel costs.
        - Identifying the best modes of transport and routes.
        - Cultural adaptation, local customs, and how to communicate with locals.
        - Suggesting hidden gems and popular places to visit.

        STRICT OUTPUT RULES:
        1. Do NOT use markdown formatting like asterisks (**bold** or * list) or hashes (###).
        2. Keep your response clean, plain text.
        3. Use numbered lists (1., 2.) or simple dashes (-) for lists.
        4. If the user asks about non-travel topics (like coding or politics), politely decline and ask to discuss travel.
      `;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction,
      });

      // Build chat history for context
      const chatHistory = updatedMessages
        .slice(1, -1)
        .map((msg) => ({
          role: msg.role === "user" ? "user" : ("model" as const),
          parts: [{ text: msg.content }],
        }));

      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      const cleanText = cleanResponseText(response.text());

      const finalMessages: Message[] = [
        ...updatedMessages,
        { role: "ai", content: cleanText },
      ];
      setMessages(finalMessages);

      // Persist to history
      persistChat(finalMessages, activeId);
    } catch (err) {
      console.error("Gemini API Error:", err);
      setError(
        "Failed to get a response. Please check your connection or API key."
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "I'm having trouble connecting right now. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------
  //  Chat history actions
  // -------------------------------------------------------------------
  const handleNewChat = () => {
    setActiveId(null);
    setMessages([DEFAULT_GREETING]);
    setError(null);
    setInput("");
    setSidebarOpen(false);
  };

  const handleLoadChat = (conv: Conversation) => {
    setActiveId(conv.id);
    setMessages(conv.messages);
    setError(null);
    setInput("");
    setSidebarOpen(false);
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([DEFAULT_GREETING]);
    }
  };

  // -------------------------------------------------------------------
  //  Grouped history
  // -------------------------------------------------------------------
  const grouped = groupByDate(conversations);

  // ===================================================================
  //  RENDER
  // ===================================================================
  return (
    <div className="flex h-[calc(100vh-4rem)] mt-16 bg-muted/30 relative">
      {/* ============================================================= */}
      {/*  SIDEBAR OVERLAY (mobile-friendly)                            */}
      {/* ============================================================= */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ============================================================= */}
      {/*  SIDEBAR                                                      */}
      {/* ============================================================= */}
      <aside
        className={`
          fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-[300px]
          bg-white border-r border-border shadow-2xl
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-base text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Chat History
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(false)}
          >
            <PanelLeftClose className="w-4 h-4" />
          </Button>
        </div>

        {/* New chat button */}
        <div className="p-3">
          <Button
            onClick={handleNewChat}
            className="w-full bg-primary hover:bg-primary/80 text-white gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Conversation list */}
        <ScrollArea className="flex-1 px-2 pb-4">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-white/80" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No conversations yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Start a new chat to see it here
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </p>
                {group.items.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleLoadChat(conv)}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-lg mb-0.5
                      flex items-center gap-3 group
                      transition-all duration-150
                      ${activeId === conv.id
                        ? "bg-primary/10 border border-primary/50 text-primary"
                        : "hover:bg-primary/10 text-foreground"
                      }
                    `}
                  >
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${activeId === conv.id
                        ? "text-primary"
                        : "text-primary/50"
                        }`}
                    />
                    <span className="text-sm truncate flex-1 font-medium">
                      {conv.title}
                    </span>
                    <button
                      onClick={(e) => handleDeleteChat(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 hover:text-red-600"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </button>
                ))}
              </div>
            ))
          )}
        </ScrollArea>
      </aside>

      {/* ============================================================= */}
      {/*  MAIN CHAT AREA                                               */}
      {/* ============================================================= */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-4 flex items-center gap-3 shadow-sm z-30">
          {/* Toggle sidebar button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Chat history"
          >
            <PanelLeftOpen className="w-5 h-5 text-muted-foreground" />
          </Button>

          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-foreground truncate">
              {activeId
                ? conversations.find((c) => c.id === activeId)?.title ||
                "Tourenvi Guide"
                : "Tourenvi Guide"}
            </h1>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${isLoading
                  ? "bg-yellow-500 animate-bounce"
                  : "bg-green-500"
                  }`}
              />
              <p className="text-xs text-muted-foreground">
                {isLoading ? "Planning trip..." : "Ready to Guide"}
              </p>
            </div>
          </div>

          {/* New Chat shortcut in header */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs shrink-0 hidden sm:flex"
            onClick={handleNewChat}
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </Button>
        </div>

        {/* Chat messages */}
        <ScrollArea className="flex-1 p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-white text-blue-600 border border-blue-100"
                    }`}
                >
                  {msg.role === "user" ? (
                    <User size={16} />
                  ) : (
                    <Bot size={16} />
                  )}
                </div>

                <div
                  className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-white border border-border rounded-tl-none"
                    }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-gray-700">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 flex-row animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-blue-600" />
                </div>
                <div className="bg-white border border-border p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Responding...
                  </span>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="flex justify-center my-2">
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-xs flex items-center gap-2 border border-red-100">
                  <AlertCircle size={14} />
                  {error}
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="px-4 pt-3 pb-1 bg-background border-t">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              placeholder="Ask anything to plan your trip"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !isLoading && handleSend()
              }
              disabled={isLoading}
              className="flex-1 border-2 border-gray-200 bg-background shadow-sm"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700 transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            Tourenvi AI can make mistakes. Verify important travel info.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;