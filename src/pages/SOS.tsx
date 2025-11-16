import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Phone, MapPin, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SOS() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-emergency/5 flex flex-col">
      <div className="flex-1 container px-4 py-8 max-w-md mx-auto flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <AlertCircle className="h-24 w-24 text-emergency mx-auto mb-4" />
          <h1 className="text-3xl font-heading font-bold mb-2">Emergency SOS</h1>
          <p className="text-muted-foreground">
            Help is one tap away. Stay calm and safe.
          </p>
        </div>

        <div className="w-full space-y-4 mb-8">
          <Card className="p-6 border-emergency/20">
            <Button
              variant="emergency"
              size="lg"
              className="w-full h-32 text-xl"
              onClick={() => {
                // TODO: Implement SOS activation in Phase 7
                console.log("SOS Activated");
              }}
            >
              <AlertCircle className="h-8 w-8 mr-2" />
              ACTIVATE SOS
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              This will alert your emergency contacts and share your location
            </p>
          </Card>

          <div className="grid gap-3">
            <Button variant="outline" size="lg" className="justify-start gap-3">
              <Phone className="h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">Call Emergency Services</p>
                <p className="text-xs text-muted-foreground">911 / Local Emergency</p>
              </div>
            </Button>

            <Button variant="outline" size="lg" className="justify-start gap-3">
              <MapPin className="h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">Share Location</p>
                <p className="text-xs text-muted-foreground">Send to trusted contacts</p>
              </div>
            </Button>

            <Button variant="outline" size="lg" className="justify-start gap-3">
              <Shield className="h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">Safe Spaces Nearby</p>
                <p className="text-xs text-muted-foreground">Police stations, hospitals</p>
              </div>
            </Button>
          </div>
        </div>

        <Button variant="ghost" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
