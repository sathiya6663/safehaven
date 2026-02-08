import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface AnalyticsEvent {
  event_name: string;
  event_data?: Record<string, any>;
  page_url?: string;
  session_id?: string;
}

// Generate a session ID for this browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export function useAnalytics() {
  const { user, userType } = useAuth();
  const location = useLocation();
  const sessionId = useRef(getSessionId());
  const pageLoadTime = useRef(Date.now());

  // Track page views automatically
  useEffect(() => {
    const timeOnPreviousPage = Date.now() - pageLoadTime.current;
    pageLoadTime.current = Date.now();

    trackEvent('page_view', {
      path: location.pathname,
      time_on_previous_page_ms: timeOnPreviousPage,
      referrer: document.referrer,
    });
  }, [location.pathname]);

  // Track session start
  useEffect(() => {
    trackEvent('session_start', {
      user_agent: navigator.userAgent,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      language: navigator.language,
      platform: navigator.platform,
    });

    // Track session end on page unload
    const handleUnload = () => {
      const sessionDuration = Date.now() - parseInt(sessionStorage.getItem('session_start_time') || String(Date.now()));
      // Use sendBeacon for reliable delivery
      const data = JSON.stringify({
        event_name: 'session_end',
        session_duration_ms: sessionDuration,
        session_id: sessionId.current,
        user_id: user?.id,
      });
      navigator.sendBeacon('/api/analytics', data);
    };

    sessionStorage.setItem('session_start_time', String(Date.now()));
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const trackEvent = useCallback(async (eventName: string, eventData?: Record<string, any>) => {
    try {
      const event: AnalyticsEvent = {
        event_name: eventName,
        event_data: eventData,
        page_url: window.location.pathname,
        session_id: sessionId.current,
      };

      // Log in development
      logger.debug('Analytics event', { event });

      // Store in Supabase
      const { error } = await supabase.from('analytics_events').insert({
        user_id: user?.id,
        user_type: userType,
        event_name: eventName,
        event_data: eventData,
        page_url: window.location.pathname,
        session_id: sessionId.current,
        device_info: {
          screen_width: window.innerWidth,
          screen_height: window.innerHeight,
          user_agent: navigator.userAgent,
        },
      });

      if (error) {
        logger.error('Failed to track analytics event', { error: error.message });
      }
    } catch (error: any) {
      logger.error('Analytics tracking error', { error: error?.message });
    }
  }, [user?.id, userType]);

  // Convenience methods for common events
  const trackFeatureUsed = useCallback((featureName: string, metadata?: Record<string, any>) => {
    trackEvent('feature_used', { feature_name: featureName, ...metadata });
  }, [trackEvent]);

  const trackError = useCallback((errorType: string, errorMessage: string, metadata?: Record<string, any>) => {
    trackEvent('error_occurred', { error_type: errorType, error_message: errorMessage, ...metadata });
  }, [trackEvent]);

  const trackEmergencyAction = useCallback((action: string, metadata?: Record<string, any>) => {
    trackEvent('emergency_action', { action, ...metadata });
  }, [trackEvent]);

  const trackCounselingSession = useCallback((action: 'start' | 'end' | 'message', metadata?: Record<string, any>) => {
    trackEvent('counseling_session', { action, ...metadata });
  }, [trackEvent]);

  const trackLearningProgress = useCallback((moduleId: string, progress: number, metadata?: Record<string, any>) => {
    trackEvent('learning_progress', { module_id: moduleId, progress, ...metadata });
  }, [trackEvent]);

  const trackFeedback = useCallback((type: string, rating?: number) => {
    trackEvent('feedback_submitted', { type, rating });
  }, [trackEvent]);

  return {
    trackEvent,
    trackFeatureUsed,
    trackError,
    trackEmergencyAction,
    trackCounselingSession,
    trackLearningProgress,
    trackFeedback,
  };
}
