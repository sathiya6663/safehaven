import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type SafetyAlert = Database['public']['Tables']['safety_alerts']['Row'];

export function useSafetyAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAlerts();
      subscribeToAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('safety_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error: any) {
      logger.error('Error fetching safety alerts', { error: error?.message });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToAlerts = () => {
    if (!user) return;

    const channel = supabase
      .channel('safety-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'safety_alerts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newAlert = payload.new as SafetyAlert;
          setAlerts(prev => [newAlert, ...prev]);
          
          // Show toast notification for critical alerts
          if (newAlert.severity === 'critical' || newAlert.severity === 'high') {
            toast.error(newAlert.title, {
              description: newAlert.description,
              duration: 10000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const acknowledgeAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('safety_alerts')
        .update({ 
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setAlerts(alerts.map(a => 
        a.id === id 
          ? { ...a, status: 'acknowledged' as const, acknowledged_at: new Date().toISOString() }
          : a
      ));
      toast.success('Alert acknowledged');
    } catch (error: any) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('safety_alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      setAlerts(alerts.map(a => 
        a.id === id 
          ? { ...a, status: 'resolved' as const, resolved_at: new Date().toISOString() }
          : a
      ));
      toast.success('Alert resolved');
    } catch (error: any) {
      toast.error('Failed to resolve alert');
    }
  };

  return {
    alerts,
    loading,
    acknowledgeAlert,
    resolveAlert,
    refetch: fetchAlerts,
  };
}
