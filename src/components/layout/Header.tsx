import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  showSOS?: boolean;
}

export const Header = ({ showSOS = true }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-heading font-bold text-primary">SafeHaven</h1>
        </div>
        
        {showSOS && (
          <Button
            variant="emergency"
            size="sm"
            onClick={() => navigate('/sos')}
            className="gap-1"
          >
            <AlertCircle className="h-4 w-4" />
            SOS
          </Button>
        )}
      </div>
    </header>
  );
};
