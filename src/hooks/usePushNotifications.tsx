import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

type NotificationPermission = 'granted' | 'denied' | 'default';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: "Not supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast({
          title: "Notifications enabled",
          description: "You'll receive important safety alerts.",
        });
        return true;
      } else {
        toast({
          title: "Notifications blocked",
          description: "You won't receive safety alerts. You can enable them in browser settings.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const sendLocalNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && isSupported) {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    sendLocalNotification,
  };
}
