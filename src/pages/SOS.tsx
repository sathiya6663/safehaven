import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Phone, MapPin, Shield, Volume2, VolumeX, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SOS() {
  const navigate = useNavigate();
  const [sosActivated, setSosActivated] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [silentMode, setSilentMode] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);
  const [customMessage, setCustomMessage] = useState("");

  const emergencyContacts = [
    { name: "Mom", phone: "(555) 123-4567" },
    { name: "Emergency Contact", phone: "(555) 987-6543" },
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sosActivated && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (sosActivated && countdown === 0) {
      // TODO: Trigger actual SOS in Phase 7
      console.log("SOS Alert Sent!");
    }
    return () => clearTimeout(timer);
  }, [sosActivated, countdown]);

  const handleActivateSOS = () => {
    setSosActivated(true);
    setCountdown(5);
  };

  const handleCancelSOS = () => {
    setSosActivated(false);
    setCountdown(5);
  };

  return (
    <div className="min-h-screen bg-emergency/5 flex flex-col">
      <div className="flex-1 container px-4 py-8 max-w-md mx-auto flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <AlertCircle className={`h-24 w-24 text-emergency mx-auto mb-4 ${sosActivated ? 'animate-pulse' : ''}`} />
          <h1 className="text-3xl font-heading font-bold mb-2">Emergency SOS</h1>
          <p className="text-muted-foreground">
            {sosActivated ? "Sending alert to emergency contacts..." : "Help is one tap away. Stay calm and safe."}
          </p>
        </div>

        <div className="w-full space-y-4 mb-8">
          {sosActivated ? (
            <Card className="p-8 border-emergency/50 bg-emergency/5">
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="text-6xl font-bold text-emergency">{countdown}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    seconds until alert is sent
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge variant="default" className="gap-2">
                    <Clock className="h-3 w-3" />
                    Alert in progress
                  </Badge>
                  {shareLocation && (
                    <Badge variant="secondary" className="gap-2 ml-2">
                      <MapPin className="h-3 w-3" />
                      Location sharing enabled
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleCancelSOS}
                >
                  Cancel Alert
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <Card className="p-6 border-emergency/20">
                <Button
                  variant="emergency"
                  size="lg"
                  className="w-full h-32 text-xl"
                  onClick={handleActivateSOS}
                >
                  <AlertCircle className="h-8 w-8 mr-2" />
                  ACTIVATE SOS
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  5 second countdown before alert is sent
                </p>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {silentMode ? (
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Label htmlFor="silent-mode">Silent Mode</Label>
                    </div>
                    <Switch
                      id="silent-mode"
                      checked={silentMode}
                      onCheckedChange={setSilentMode}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="share-location">Share Location</Label>
                    </div>
                    <Switch
                      id="share-location"
                      checked={shareLocation}
                      onCheckedChange={setShareLocation}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom-message">Custom Message (Optional)</Label>
                    <Textarea
                      id="custom-message"
                      placeholder="Add additional details for emergency contacts..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Emergency Contacts</h3>
              <div className="space-y-2">
                {emergencyContacts.map((contact, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.phone}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // TODO: Implement direct call in Phase 7
                        console.log(`Calling ${contact.phone}`);
                      }}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            <Button
              variant="outline"
              size="lg"
              className="justify-start gap-3"
              onClick={() => {
                // TODO: Implement emergency call in Phase 7
                console.log("Calling 911");
              }}
            >
              <Phone className="h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">Call Emergency Services</p>
                <p className="text-xs text-muted-foreground">911 / Local Emergency</p>
              </div>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="justify-start gap-3"
              onClick={() => navigate('/emergency')}
            >
              <Shield className="h-5 w-5" />
              <div className="text-left">
                <p className="font-semibold">Safe Spaces Nearby</p>
                <p className="text-xs text-muted-foreground">Police stations, hospitals</p>
              </div>
            </Button>
          </div>
        </div>

        {!sosActivated && (
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
