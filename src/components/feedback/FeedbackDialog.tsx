import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Bug, Lightbulb, MessageCircle, Star } from 'lucide-react';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FeedbackType = 'bug' | 'feature' | 'general' | 'rating';

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const feedbackTypes = [
    { value: 'bug', label: 'Report Bug', icon: Bug, description: 'Something isn\'t working' },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb, description: 'Suggest an improvement' },
    { value: 'general', label: 'General Feedback', icon: MessageCircle, description: 'Share your thoughts' },
    { value: 'rating', label: 'Rate Experience', icon: Star, description: 'Rate the app' },
  ];

  const handleSubmit = async () => {
    if (!message.trim() && type !== 'rating') {
      toast({
        title: 'Please enter your feedback',
        variant: 'destructive',
      });
      return;
    }

    if (type === 'rating' && rating === 0) {
      toast({
        title: 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Use rpc or raw query since table types aren't regenerated yet
      const { error } = await supabase.rpc('exec_sql' as any, {}) as any;
      
      // Fallback to direct insert with type assertion
      const insertResult = await (supabase as any).from('user_feedback').insert({
        user_id: user?.id,
        feedback_type: type,
        message: message.trim(),
        rating: type === 'rating' ? rating : null,
        page_url: window.location.pathname,
        user_agent: navigator.userAgent,
        screen_size: `${window.innerWidth}x${window.innerHeight}`,
      });

      if (insertResult.error) throw insertResult.error;

      toast({
        title: 'Thank you for your feedback!',
        description: 'We appreciate you helping us improve SafeHaven.',
      });
      
      setMessage('');
      setRating(0);
      setType('general');
      setCurrentPage(1);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Failed to submit feedback',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessage('');
    setRating(0);
    setType('general');
    setCurrentPage(1);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleReset();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve SafeHaven by sharing your thoughts
          </DialogDescription>
        </DialogHeader>

        {currentPage === 1 && (
          <div className="space-y-4">
            <Label>What type of feedback do you have?</Label>
            <div className="grid grid-cols-2 gap-3">
              {feedbackTypes.map((ft) => (
                <button
                  key={ft.value}
                  onClick={() => {
                    setType(ft.value as FeedbackType);
                    setCurrentPage(2);
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all hover:border-primary hover:bg-primary/5 ${
                    type === ft.value ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <ft.icon className="h-6 w-6 text-primary mb-2" />
                  <p className="font-medium text-sm">{ft.label}</p>
                  <p className="text-xs text-muted-foreground">{ft.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentPage === 2 && (
          <div className="space-y-4">
            {type === 'rating' && (
              <div className="space-y-2">
                <Label>How would you rate SafeHaven?</Label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-2 transition-transform hover:scale-110"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="feedback-message">
                {type === 'bug' && 'Describe the bug you encountered'}
                {type === 'feature' && 'Describe your feature idea'}
                {type === 'general' && 'Share your feedback'}
                {type === 'rating' && 'Any additional comments? (optional)'}
              </Label>
              <Textarea
                id="feedback-message"
                placeholder={
                  type === 'bug'
                    ? 'What happened? What did you expect to happen?'
                    : type === 'feature'
                    ? 'What would you like to see in SafeHaven?'
                    : 'Tell us what you think...'
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentPage(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? 'Sending...' : 'Submit Feedback'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
