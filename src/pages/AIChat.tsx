import React, { useMemo, useRef, useState } from "react";
import { Send, Sparkles, User, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useTrip } from "@/context/TripContext";
import { useNavigate } from "react-router-dom";

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

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
  const navigate = useNavigate();
  const { trip } = useTrip();
  const destination = trip.destinations[0] || trip.itinerary[0]?.morning.title || "your destination";

  const quickPills = useMemo(
    () => [
      `Best time to visit ${destination}`,
      `Hidden gems near ${destination}`,
      `Estimate food cost for ${trip.numberOfMembers || 2} people`,
      "Eco-friendly alternatives",
    ],
    [destination, trip.numberOfMembers],
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ai",
      content:
        "Hello! I am WanderSmart AI. I can help with trip plans, costs, local tips, route suggestions, and eco-friendly travel.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const runPrompt = async (promptText: string) => {
    if (!promptText.trim() || isLoading) {
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: promptText }]);
    setIsLoading(true);

    try {
      const tripContext = JSON.stringify({
        destination: trip.destinations,
        dates: { start: trip.startDate, end: trip.endDate },
        members: trip.numberOfMembers,
        budget: trip.costBreakdown,
        vehicleType: trip.vehicleType,
        moods: trip.moods,
      });

      const systemPrompt = `You are WanderSmart AI, a smart India travel assistant.
User's current trip context: ${tripContext}
Help with trip planning, costs, local tips, route suggestions, and eco-friendly travel.`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(`${systemPrompt}\n\nUser: ${promptText}`);
      const content = result.response.text().replace(/\*\*/g, "").replace(/#{1,4}/g, "").trim();
      setMessages((prev) => [...prev, { role: "ai", content }]);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "I could not respond right now. Please retry." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToTrip = (text: string) => {
    const destinationMention = text.split(/\s+/).find((word) => /^[A-Z][a-z]{3,}$/.test(word));
    if (destinationMention) {
      const event = new CustomEvent("tourenvi:setDestination", { detail: { destination: destinationMention } });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="fixed inset-x-0 top-16 bottom-0 flex flex-col bg-white overflow-hidden font-sans z-10">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 shrink-0 z-20 shadow-2xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">WanderSmart AI</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-wider">
                  Travel Assistant
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {trip.destinations[0] ? `Active Context: ${trip.destinations[0]} Trip` : "Personalized India Travel Guide"}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessages([
              {
                role: "ai",
                content: "Hello! I am WanderSmart AI. I can help with trip plans, costs, local tips, route suggestions, and eco-friendly travel.",
              }
            ])}
            className="text-xs text-gray-400 hover:text-gray-700 h-8 px-2.5 rounded-lg"
            title="Reset conversation"
          >
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Chat Stream */}
      <ScrollArea className="flex-1 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-6">
          {/* Welcome Starter Section (Shown on initial conversation) */}
          {messages.length === 1 && (
            <div className="py-6 sm:py-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <Bot size={30} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
                  How can I help with your journey today?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Ask me anything about routes, scenic stops, cost estimations, local dining, or eco-friendly travel.
                </p>
              </div>

              {/* 2x2 Starter Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-2xl mx-auto pt-2">
                <button
                  type="button"
                  onClick={() => runPrompt(`What are the best sightseeing spots and hidden gems in ${destination}?`)}
                  className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-emerald-400 hover:shadow-sm transition-all duration-200 group text-left"
                >
                  <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                    💎 Discover Hidden Gems
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Top sightseeing landmarks and scenic stops</p>
                </button>

                <button
                  type="button"
                  onClick={() => runPrompt(`What is the optimal route and travel tips for ${destination}?`)}
                  className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-emerald-400 hover:shadow-sm transition-all duration-200 group text-left"
                >
                  <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                    🧭 Optimal Route & Roads
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Highway conditions, toll estimates & transit tips</p>
                </button>

                <button
                  type="button"
                  onClick={() => runPrompt(`Estimate food, stay, and daily travel expenses for ${trip.numberOfMembers || 2} people visiting ${destination}`)}
                  className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-emerald-400 hover:shadow-sm transition-all duration-200 group text-left"
                >
                  <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                    💰 Budget & Cost Estimation
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Per-person daily expenses, food & stay budget</p>
                </button>

                <button
                  type="button"
                  onClick={() => runPrompt(`What are eco-friendly travel options and sustainable tips for ${destination}?`)}
                  className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-emerald-400 hover:shadow-sm transition-all duration-200 group text-left"
                >
                  <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                    🌿 Eco-Friendly Alternatives
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Low-carbon transport & sustainable local experiences</p>
                </button>
              </div>
            </div>
          )}

          {/* Messages list */}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2.5 sm:gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${msg.role === "user"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}>
                {msg.role === "user" ? <User size={15} /> : <Bot size={15} />}
              </div>
              <div className={`p-3.5 sm:p-4 rounded-2xl leading-relaxed text-xs sm:text-sm ${msg.role === "user"
                  ? "bg-emerald-600 text-white shadow-xs rounded-tr-xs max-w-[85%] sm:max-w-[75%]"
                  : "bg-gray-50/80 border border-gray-200/80 text-gray-800 shadow-2xs rounded-tl-xs max-w-[92%] sm:max-w-[85%]"
                }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.role === "ai" && (
                  <div className="mt-3 pt-2.5 border-t border-gray-200/60 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 font-semibold"
                      onClick={() => addToTrip(msg.content)}
                    >
                      Add to Trip
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                      onClick={() => navigate("/hotels")}
                    >
                      View Hotels
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 sm:gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
                <Bot size={15} className="text-emerald-700" />
              </div>
              <div className="bg-gray-50 border border-gray-200/80 p-3.5 rounded-2xl rounded-tl-xs flex items-center gap-2 shadow-2xs">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span className="text-xs text-gray-500 font-medium">WanderSmart is thinking...</span>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Pinned Bottom Input Bar */}
      <div className="shrink-0 bg-white border-t border-gray-100 pt-3 pb-4 px-3 sm:px-4 z-20">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center bg-white rounded-2xl border border-gray-300 shadow-sm hover:border-gray-400 focus-within:border-emerald-600 focus-within:shadow-md transition-all duration-200 p-1 pl-3.5 sm:pl-4">
            <input
              type="text"
              placeholder="Ask about your trip, routes, places, costs..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runPrompt(input)}
              disabled={isLoading}
              className="w-full bg-transparent border-0 outline-none focus:outline-none text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 py-2 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => runPrompt(input)}
              disabled={isLoading || !input.trim()}
              className={`h-9 w-9 sm:h-9.5 sm:w-9.5 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${input.trim() && !isLoading
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] sm:text-[11px] text-gray-400 text-center mt-2 font-sans">
            WanderSmart AI provides smart route insights and trip cost estimates.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
