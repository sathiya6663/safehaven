import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Send, X, Heart, Brain, Lightbulb, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useAICounseling } from "@/hooks/useAICounseling";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function CounselingSession() {
  const navigate = useNavigate();
  const { user, userType } = useAuth();
  const { streamChat, isLoading, crisisDetected } = useAICounseling(userType || 'woman');
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm here to support you. How are you feeling today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [emotionalState, setEmotionalState] = useState<"calm" | "anxious" | "stressed" | "happy">("calm");
  const [sessionTime, setSessionTime] = useState(0);
  const [showCrisisDialog, setShowCrisisDialog] = useState(false);
  const [copingStrategies, setCopingStrategies] = useState([
    { icon: Heart, title: "Deep Breathing", description: "Try 4-7-8 breathing technique" },
    { icon: Brain, title: "Mindfulness", description: "Focus on present moment" },
    { icon: Lightbulb, title: "Positive Affirmation", description: "You are capable and strong" },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('counseling_sessions')
        .insert({
          user_id: user.id,
          session_date: new Date().toISOString(),
          emotional_state: emotionalState,
        })
        .select()
        .single();

      if (!error && data) {
        sessionIdRef.current = data.id;
      }

      // Load AI-generated coping strategies
      loadCopingStrategies();
    };

    initSession();
  }, [user]);

  // Save session when unmounting
  useEffect(() => {
    return () => {
      if (sessionIdRef.current && user) {
        supabase
          .from('counseling_sessions')
          .update({
            duration_minutes: Math.floor(sessionTime / 60),
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessionIdRef.current)
          .then(() => console.log('Session saved'));
      }
    };
  }, [sessionTime, user]);

  // Check for crisis detection
  useEffect(() => {
    if (crisisDetected) {
      setShowCrisisDialog(true);
    }
  }, [crisisDetected]);

  const loadCopingStrategies = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-coping-strategies', {
        body: {
          emotionalState,
          userType: userType || 'woman',
          recentTopics: messages
            .filter(m => m.role === 'user')
            .slice(-3)
            .map(m => m.content),
        },
      });

      if (!error && data && data.length > 0) {
        const iconMap: Record<string, any> = {
          heart: Heart,
          brain: Brain,
          lightbulb: Lightbulb,
        };

        setCopingStrategies(
          data.map((s: any) => ({
            ...s,
            icon: iconMap[s.icon] || Lightbulb,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load coping strategies:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    let assistantSoFar = "";
    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar, timestamp: new Date() }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMessage],
        emotionalState,
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => {
          // Reload coping strategies after conversation
          loadCopingStrategies();
        },
      });
    } catch (e) {
      console.error('Chat error:', e);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCrisisEscalation = () => {
    if (confirm("Do you need immediate emergency support? This will activate the SOS system.")) {
      navigate("/sos");
    }
  };

  return (
    <>
      {/* Crisis Detection Dialog */}
      <AlertDialog open={showCrisisDialog} onOpenChange={setShowCrisisDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-emergency" />
              Crisis Support Available
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                I detected that you might be in distress. You don't have to face this alone.
              </p>
              <p className="font-medium">
                Would you like to activate emergency support services now?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Chatting</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emergency hover:bg-emergency/90"
              onClick={() => {
                setShowCrisisDialog(false);
                navigate('/sos');
              }}
            >
              Get Emergency Help
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="container px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary">AI</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-heading font-semibold text-sm">AI Counselor</p>
                <p className="text-xs text-muted-foreground">Always here for you</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate("/counseling")}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Session Info Bar */}
      <div className="border-b bg-muted/30">
        <div className="container px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-muted-foreground">Session Time: </span>
                <span className="font-semibold">{formatTime(sessionTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Mood: </span>
                <div className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  emotionalState === "calm" && "bg-primary/10 text-primary",
                  emotionalState === "anxious" && "bg-accent/10 text-accent",
                  emotionalState === "stressed" && "bg-destructive/10 text-destructive",
                  emotionalState === "happy" && "bg-secondary/10 text-secondary"
                )}>
                  {emotionalState}
                </div>
              </div>
            </div>
            <Button 
              variant="emergency" 
              size="sm"
              onClick={handleCrisisEscalation}
            >
              <AlertCircle className="mr-1 h-4 w-4" />
              Crisis Help
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container px-4 py-6 max-w-2xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-lg px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.role === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-secondary/10 text-secondary text-xs">U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Coping Strategies Suggestions */}
      <div className="border-t bg-muted/30">
        <div className="container px-4 py-3 max-w-2xl mx-auto">
          <p className="text-xs text-muted-foreground mb-2">Suggested coping strategies:</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {copingStrategies.map((strategy, index) => {
              const Icon = strategy.icon;
              return (
                <Card key={index} className="p-3 min-w-[180px] hover:shadow-medium transition-shadow cursor-pointer">
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold mb-0.5">{strategy.title}</p>
                      <p className="text-xs text-muted-foreground">{strategy.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background">
        <div className="container px-4 py-4 max-w-2xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Share what's on your mind..."
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Your conversations are private and confidential
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
