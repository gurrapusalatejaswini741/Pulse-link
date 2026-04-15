import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { ArrowLeft, Send, Sparkles, User, Bot, AlertCircle } from "lucide-react";
import { 
  useCreateGeminiConversation,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
}

export default function FanAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "init", role: "model", content: "Pulse-Link AI Online. I have real-time access to stadium density, wait times, and optimal routing. How can I assist your match day experience?" }
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createConversation = useCreateGeminiConversation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    setInput("");
    
    // Add user message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: "user", content: userText }]);
    
    let currentConvId = conversationId;

    try {
      if (!currentConvId) {
        const conv = await createConversation.mutateAsync({ data: { title: "Fan Inquiry" } });
        currentConvId = conv.id;
        setConversationId(conv.id);
      }

      setIsStreaming(true);
      
      // Add empty model message placeholder
      const modelMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: modelMsgId, role: "model", content: "" }]);

      const response = await fetch(`/api/gemini/conversations/${currentConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userText })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setMessages(prev => prev.map(m => 
                  m.id === modelMsgId 
                    ? { ...m, content: m.content + parsed.text }
                    : m
                ));
              }
            } catch (e) {
              console.error("Error parsing SSE chunk", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "model", content: "Error: Connection lost to command center. Please try again." }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const askQuickQuestion = (text: string) => {
    setInput(text);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#0a0f1e] text-foreground font-mono">
      <header className="px-4 py-4 border-b border-border/30 bg-card/80 backdrop-blur flex items-center gap-3 sticky top-0 z-10">
        <Link href="/fan" className="text-muted-foreground hover:text-primary transition-colors p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="font-bold text-lg uppercase tracking-widest text-primary">Aura<span className="text-foreground text-sm opacity-50">/AI</span></h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 text-primary">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div className={`max-w-[80%] rounded px-4 py-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-secondary/20 border border-secondary/30 text-secondary-foreground text-secondary' 
                : 'bg-card border border-border/50 text-foreground'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.role === 'model' && !msg.content && isStreaming && (
                <div className="flex gap-1 items-center mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="h-8 w-8 rounded bg-secondary/20 flex items-center justify-center shrink-0 border border-secondary/30 text-secondary">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <div className="p-4 bg-background border-t border-border/30">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => askQuickQuestion("Where is the shortest line for water?")} className="text-xs bg-card border border-border/50 px-3 py-1.5 rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors text-left">
              Shortest line for water?
            </button>
            <button onClick={() => askQuickQuestion("Which gate has the least crowd right now?")} className="text-xs bg-card border border-border/50 px-3 py-1.5 rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors text-left">
              Least crowded gate?
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Aura AI..."
            disabled={isStreaming}
            className="bg-card border-border/50 focus-visible:ring-primary focus-visible:ring-1 font-sans text-sm"
          />
          <Button 
            type="submit" 
            disabled={isStreaming || !input.trim()}
            size="icon"
            className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}