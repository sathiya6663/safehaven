import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAICounseling } from '@/hooks/useAICounseling';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; content: string };

/**
 * Persistent floating AI Companion chat. Hidden on auth/SOS routes.
 */
export function AICompanionWidget() {
  const { user, userType } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const { streamChat, isLoading } = useAICounseling(userType || 'adult');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
      setMessages([
        {
          role: 'assistant',
          content: `${greeting}! I'm your SafeGuard companion. How can I support you right now?`,
        },
      ]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) return null;
  // Hide on SOS / auth pages where it would distract
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (['/sos', '/signin', '/signup', '/'].includes(path)) return null;

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: input };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    let acc = '';
    await streamChat({
      messages: [...messages, userMsg],
      onDelta: (chunk) => {
        acc += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m));
          }
          return [...prev, { role: 'assistant', content: acc }];
        });
      },
      onDone: () => {},
    });
  };

  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          aria-label="Open AI companion"
          className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full shadow-strong"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}
      {open && (
        <Card className="fixed bottom-24 right-4 z-40 w-[min(380px,calc(100vw-2rem))] h-[480px] flex flex-col shadow-strong">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-heading font-semibold text-sm">AI Companion</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close companion">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm max-w-[85%]',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : 'bg-muted'
                )}
              >
                {m.content}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask anything…"
              className="flex-1"
            />
            <Button onClick={send} disabled={!input.trim() || isLoading} size="icon">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
