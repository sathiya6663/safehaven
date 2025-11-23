import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type ModerationResult = {
  isSafe: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  categories: string[];
  explanation: string;
  actionRequired: 'none' | 'alert' | 'block' | 'escalate';
};

export function useContentModeration() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { user } = useAuth();

  const moderateContent = async (
    text: string,
    context?: string
  ): Promise<ModerationResult> => {
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('content-moderation', {
        body: {
          text,
          userId: user?.id,
          context,
        },
      });

      if (error) throw error;

      return data as ModerationResult;
    } catch (error) {
      console.error('Content moderation error:', error);
      // Fail-safe: treat as potentially unsafe if service is unavailable
      return {
        isSafe: false,
        severity: 'medium',
        categories: ['analysis_unavailable'],
        explanation: 'Content moderation service temporarily unavailable',
        actionRequired: 'alert',
      };
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { moderateContent, isAnalyzing };
}
