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
    <div className="flex flex-col h-[calc(100vh-4rem)] mt-16 bg-muted/30">
      <div className="bg-background border-b p-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="font-bold text-foreground">WanderSmart AI</h1>
          <p className="text-xs text-muted-foreground">Trip context enabled</p>
        </div>
      </div>

      <div className="px-4 pt-3 pb-1 flex flex-wrap gap-2 border-b bg-background/80">
        {quickPills.map((pill) => (
          <Button key={pill} size="sm" variant="outline" onClick={() => runPrompt(pill)}>
            {pill}
          </Button>
        ))}
      </div>

      <ScrollArea className="flex-1 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-white text-blue-600 border"}`}>
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-white border"}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.role === "ai" && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => addToTrip(msg.content)}>
                      Add to Trip
                    </Button>
                    <Button size="sm" onClick={() => navigate("/hotels")}>View Hotels</Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center">
                <Bot size={16} className="text-blue-600" />
              </div>
              <div className="bg-white border p-3 rounded-xl flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-background border-t">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            placeholder="Ask about your active trip"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runPrompt(input)}
            disabled={isLoading}
          />
          <Button onClick={() => runPrompt(input)} disabled={isLoading || !input.trim()} size="icon">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
