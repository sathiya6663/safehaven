import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackDialog } from './FeedbackDialog';

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-24 right-4 z-50 shadow-lg rounded-full h-12 w-12 p-0 md:h-auto md:w-auto md:px-4 md:rounded-md"
        aria-label="Send Feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
        <span className="hidden md:inline ml-2">Feedback</span>
      </Button>
      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
