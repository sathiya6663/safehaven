import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type EmergencyContact = Database['public']['Tables']['emergency_contacts']['Row'];
type EmergencyContactInsert = Database['public']['Tables']['emergency_contacts']['Insert'];
type EmergencyContactUpdate = Database['public']['Tables']['emergency_contacts']['Update'];

export function useEmergencyContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      logger.error('Error fetching emergency contacts', { error: error?.message });
      toast.error('Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (contact: Omit<EmergencyContactInsert, 'user_id'>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({ ...contact, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setContacts([...contacts, data]);
      toast.success('Emergency contact added');
      return { data, error: null };
    } catch (error: any) {
      toast.error('Failed to add emergency contact');
      return { data: null, error };
    }
  };

  const updateContact = async (id: string, updates: EmergencyContactUpdate) => {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setContacts(contacts.map(c => c.id === id ? data : c));
      toast.success('Emergency contact updated');
      return { data, error: null };
    } catch (error: any) {
      toast.error('Failed to update emergency contact');
      return { data: null, error };
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContacts(contacts.filter(c => c.id !== id));
      toast.success('Emergency contact removed');
      return { error: null };
    } catch (error: any) {
      toast.error('Failed to remove emergency contact');
      return { error };
    }
  };

  return {
    contacts,
    loading,
    addContact,
    updateContact,
    deleteContact,
    refetch: fetchContacts,
  };
}
