import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// Ensure VITE_GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

const AIChat = () => {
  const [messages, setMessages] = useState([
    { 
      role: "ai", 
      content: "Hello! I'm your Tourenvi Travel Guide. I can help you with:\n\n• Detailed Tour Plans & Itineraries\n• Cost & Fuel Estimation\n• Best Places to Visit & Transport Routes\n• Cultural Tips & Local Communication\n\nWhere are you planning to go?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Helper function to clean text (Remove asterisks and clean up formatting)
  const cleanResponseText = (text: string) => {
    return text
      .replace(/\*\*/g, "")   // Remove bolding asterisks (**)
      .replace(/\*/g, "•")    // Replace list bullets (*) with nice dots (•)
      .replace(/#{1,3}/g, ""); // Remove heading hashes (###)
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput("");
    setError(null);

    // 1. Add User Message to UI
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // 2. Define the System Persona & Rules
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

      // 3. Call Gemini API
      // Using 'gemini-1.5-flash' as it is fast and efficient for this.
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      // Combine system instruction with user query
      const finalPrompt = `${systemInstruction}\n\nUser Question: ${userMessage}`;

      const result = await model.generateContent(finalPrompt);
      const response = await result.response;
      const rawText = response.text();
      
      // Clean the text before saving
      const cleanText = cleanResponseText(rawText);

      // 4. Add AI Response to UI
      setMessages((prev) => [...prev, { role: "ai", content: cleanText }]);
    } catch (err) {
      console.error("Gemini API Error:", err);
      setError("Failed to get a response. Please check your connection or API key.");
      
      setMessages((prev) => [
        ...prev, 
        { role: "ai", content: "I'm having trouble connecting right now. Please try again later." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] mt-16 bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b p-4 flex items-center gap-3 shadow-sm z-10">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="font-bold text-foreground">Tourenvi Guide</h1>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isLoading ? "bg-yellow-500 animate-bounce" : "bg-green-500"}`} /> 
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Planning trip..." : "Ready to Guide"}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-white text-blue-600 border border-blue-100"
              }`}>
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-white border border-border rounded-tl-none"
              }`}>
                <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-gray-700">
                  {/* The content is already cleaned by cleanResponseText */}
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator Bubble */}
          {isLoading && (
             <div className="flex gap-3 flex-row animate-in fade-in duration-300">
               <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center shrink-0">
                 <Bot size={16} className="text-blue-600" />
               </div>
               <div className="bg-white border border-border p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                 <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                 <span className="text-xs text-muted-foreground">Analyzing travel data...</span>
               </div>
             </div>
          )}
          
          {/* Error Message Display */}
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

      {/* Input Area */}
      <div className="p-4 bg-background border-t">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            placeholder="Ask anything to plan your trip"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
            disabled={isLoading}
            className="flex-1 border-2 border-gray-200 bg-background shadow-sm"
          />
          <Button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()}
            size="icon" 
            className="bg-blue-600 hover:bg-blue-700 transition-all"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
           Tourenvi AI can make mistakes. Verify important travel info.
        </p>
      </div>
    </div>
  );
};

export default AIChat;