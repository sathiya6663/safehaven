import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function useAICounseling(userType: 'woman' | 'child' | 'guardian' = 'woman') {
  const [isLoading, setIsLoading] = useState(false);
  const [crisisDetected, setCrisisDetected] = useState(false);
  const { toast } = useToast();

  const streamChat = async ({
    messages,
    emotionalState,
    onDelta,
    onDone,
  }: {
    messages: Message[];
    emotionalState?: string;
    onDelta: (deltaText: string) => void;
    onDone: () => void;
  }) => {
    setIsLoading(true);
    setCrisisDetected(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-counseling-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages, 
            emotionalState: emotionalState || 'neutral',
            userType 
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Please slow down",
            description: "Too many requests. Please wait a moment and try again.",
            variant: "destructive",
          });
          return;
        }
        if (response.status === 402) {
          toast({
            title: "Service unavailable",
            description: "The counseling service is temporarily unavailable.",
            variant: "destructive",
          });
          return;
        }
        throw new Error('Failed to start counseling chat');
      }

      // Check for crisis detection in headers
      const crisisFlag = response.headers.get('X-Crisis-Detected');
      if (crisisFlag === 'true') {
        setCrisisDetected(true);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) onDelta(content);
          } catch {
            // Ignore partial leftovers
          }
        }
      }

      onDone();
    } catch (error) {
      console.error('Counseling chat error:', error);
      toast({
        title: "Connection error",
        description: "Unable to connect to counseling service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { streamChat, isLoading, crisisDetected };
}
