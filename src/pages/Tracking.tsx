import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MapPin,
  Navigation,
  Play,
  Square,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface TrustedContact {
  id: number;
  name: string;
  initials: string;
  canView: boolean;
}

interface Journey {
  id: string;
  destination: string;
  startTime: string;
  status: "active" | "completed";
  duration: string;
}

export default function Tracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    location,
    error: geoError,
    isLoading: geoLoading,
    getCurrentLocation,
    watchLocation,
    clearWatch,
  } = useGeolocation();

  const [isTracking, setIsTracking] = useState(false);
  const [destination, setDestination] = useState("");
  const [trackingStart, setTrackingStart] = useState<Date | null>(null);
  const [locationSharing, setLocationSharing] = useState(true);
  const [autoCheckIn, setAutoCheckIn] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);

  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [addingContact, setAddingContact] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get initial location on mount
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Load emergency contacts from Supabase
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("emergency_contacts")
        .select("id, contact_name, contact_phone")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (data) {
        setContacts(
          data.map((c, i) => ({
            id: i + 1,
            name: c.contact_name,
            initials: c.contact_name
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2),
            canView: true,
          }))
        );
      }
    })();
  }, [user]);

  // Load journey history from Supabase
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("location_tracking")
        .select("id, created_at, location_timestamp, latitude, longitude, is_emergency")
        .eq("user_id", user.id)
        .order("location_timestamp", { ascending: false })
        .limit(10);

      if (data) {
        const grouped: Journey[] = data.slice(0, 5).map((row) => ({
          id: String(row.id),
          destination: `${Number(row.latitude).toFixed(4)}, ${Number(row.longitude).toFixed(4)}`,
          startTime: new Date(row.location_timestamp ?? row.created_at).toLocaleString(),
          status: "completed" as const,
          duration: "",
        }));
        setJourneys(grouped);
      }
    })();
  }, [user]);

  /** Elapsed time string from a start Date to now */
  function elapsedSince(start: Date): string {
    const mins = Math.floor((Date.now() - start.getTime()) / 60_000);
    if (mins < 1) return "< 1 min";
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  /** Save a location point to Supabase */
  async function saveLocationPoint(lat: number, lon: number) {
    if (!user) return;
    await supabase.from("location_tracking").insert({
      user_id: user.id,
      latitude: lat,
      longitude: lon,
      location_timestamp: new Date().toISOString(),
      is_emergency: false,
    });
  }

  const handleStartJourney = () => {
    if (!location) {
      toast({
        title: "Location unavailable",
        description: "Could not get your current location. Please enable location access and try again.",
        variant: "destructive",
      });
      getCurrentLocation();
      return;
    }

    setIsTracking(true);
    setTrackingStart(new Date());

    // Save initial point
    saveLocationPoint(location.latitude, location.longitude);

    // Start watching for position updates
    if (locationSharing) {
      const id = watchLocation((coords) => {
        saveLocationPoint(coords.latitude, coords.longitude);
      });
      if (id !== null) watchIdRef.current = id;
    }
  };

  const handleEndJourney = () => {
    // Stop watching
    if (watchIdRef.current !== null) {
      clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const duration = trackingStart ? elapsedSince(trackingStart) : "";
    const newJourney: Journey = {
      id: Date.now().toString(),
      destination: destination || "Unknown destination",
      startTime: trackingStart?.toLocaleString() ?? new Date().toLocaleString(),
      status: "completed",
      duration,
    };

    setJourneys((prev) => [newJourney, ...prev]);
    setIsTracking(false);
    setTrackingStart(null);
    setDestination("");

    toast({ title: "Journey ended", description: "Your journey has been saved." });
  };

  const toggleContactVisibility = (id: number) => {
    setContacts(contacts.map((c) => (c.id === id ? { ...c, canView: !c.canView } : c)));
  };

  const handleAddContact = async () => {
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    if (!user) return;
    setAddingContact(true);
    const { error } = await supabase.from("emergency_contacts").insert({
      user_id: user.id,
      contact_name: newContactName.trim(),
      contact_phone: newContactPhone.trim(),
      is_primary: contacts.length === 0,
    });
    setAddingContact(false);
    if (error) {
      toast({ title: "Error", description: "Could not add contact.", variant: "destructive" });
      return;
    }
    const initials = newContactName
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    setContacts((prev) => [
      ...prev,
      { id: Date.now(), name: newContactName.trim(), initials, canView: true },
    ]);
    setNewContactName("");
    setNewContactPhone("");
    setDialogOpen(false);
    toast({ title: "Contact added", description: `${newContactName} can now view your location.` });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Location Tracking</h1>
          <p className="text-muted-foreground">Share your journey with trusted contacts</p>
        </div>

        {/* Live Location Status */}
        {geoError ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-destructive">Location Error</p>
                <p className="text-sm text-destructive/90 mt-1">{geoError}</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={getCurrentLocation}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : location ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">Live location active</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  {location.accuracy ? ` · ±${Math.round(location.accuracy)} m` : ""}
                </p>
              </div>
              {isTracking && (
                <Badge variant="default" className="animate-pulse">Live</Badge>
              )}
            </CardContent>
          </Card>
        ) : geoLoading ? (
          <Card>
            <CardContent className="py-6 flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Getting your location…</p>
            </CardContent>
          </Card>
        ) : null}

        {/* Current Journey */}
        <Card className={isTracking ? "border-primary/50" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${isTracking ? "bg-primary/10" : "bg-muted"}`}>
                  <Navigation
                    className={`h-6 w-6 ${isTracking ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
                <div>
                  <CardTitle>{isTracking ? "Journey in Progress" : "Start Tracking"}</CardTitle>
                  <CardDescription>
                    {isTracking ? "Your location is being recorded" : "Begin a new journey"}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTracking ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="current-destination">Destination</Label>
                  <Input
                    id="current-destination"
                    placeholder="e.g., Home, Office, Friend's place"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        Started at {trackingStart?.toLocaleTimeString() ?? "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {trackingStart ? elapsedSince(trackingStart) : ""}
                      </p>
                    </div>
                  </div>
                  <MapPin className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <Button variant="outline" className="w-full" onClick={handleEndJourney}>
                  <Square className="h-4 w-4 mr-2" />
                  End Journey
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    placeholder="e.g., Home, Office, Friend's place"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleStartJourney} disabled={geoLoading}>
                  {geoLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start Journey
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Tracking Settings</CardTitle>
            <CardDescription>Customize your location sharing preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Location Sharing</Label>
                <p className="text-sm text-muted-foreground">
                  Share live location with trusted contacts
                </p>
              </div>
              <Switch checked={locationSharing} onCheckedChange={setLocationSharing} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Check-in Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded to confirm safe arrival
                </p>
              </div>
              <Switch checked={autoCheckIn} onCheckedChange={setAutoCheckIn} />
            </div>
          </CardContent>
        </Card>

        {/* Trusted Contacts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Trusted Contacts</CardTitle>
                <CardDescription>Manage who can see your location</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Trusted Contact</DialogTitle>
                    <DialogDescription>
                      Add someone who can track your location during journeys
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Name</Label>
                      <Input
                        id="contact-name"
                        placeholder="Enter contact name"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Phone Number</Label>
                      <Input
                        id="contact-phone"
                        placeholder="+91 98765 43210"
                        type="tel"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleAddContact}
                      disabled={addingContact || !newContactName.trim() || !newContactPhone.trim()}
                    >
                      {addingContact ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Add Contact
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No trusted contacts yet. Add someone so they can track your journeys.
              </p>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {contact.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contact.canView ? "Can view location" : "Access disabled"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleContactVisibility(contact.id)}
                        aria-label={contact.canView ? "Disable location access" : "Enable location access"}
                      >
                        {contact.canView ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Journey History */}
        <Card>
          <CardHeader>
            <CardTitle>Journey History</CardTitle>
            <CardDescription>Your recent tracked journeys</CardDescription>
          </CardHeader>
          <CardContent>
            {journeys.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No journeys recorded yet. Start tracking to see your history here.
              </p>
            ) : (
              <div className="space-y-3">
                {journeys.map((journey) => (
                  <div key={journey.id} className="flex items-center gap-4 p-4 rounded-lg border">
                    <div
                      className={`p-2 rounded-full ${
                        journey.status === "active" ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      {journey.status === "active" ? (
                        <AlertCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{journey.destination}</p>
                        {journey.status === "active" && (
                          <Badge variant="default" className="text-xs shrink-0">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {journey.startTime}
                        </span>
                        {journey.duration && <span>{journey.duration}</span>}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" aria-label="View on map"
                      onClick={() => {
                        const [lat, lon] = journey.destination.split(",").map(Number);
                        if (!isNaN(lat) && !isNaN(lon)) {
                          window.open(
                            `https://www.google.com/maps?q=${lat},${lon}`,
                            "_blank"
                          );
                        }
                      }}
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomTabBar />
    </div>
  );
}
