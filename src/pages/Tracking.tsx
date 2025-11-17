import { useState } from "react";
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
  EyeOff
} from "lucide-react";

interface TrustedContact {
  id: number;
  name: string;
  initials: string;
  canView: boolean;
}

interface Journey {
  id: number;
  destination: string;
  startTime: string;
  status: "active" | "completed";
  duration: string;
}

export default function Tracking() {
  const [isTracking, setIsTracking] = useState(false);
  const [locationSharing, setLocationSharing] = useState(true);
  const [autoCheckIn, setAutoCheckIn] = useState(true);

  const [contacts, setContacts] = useState<TrustedContact[]>([
    { id: 1, name: "Mom", initials: "M", canView: true },
    { id: 2, name: "Sarah (Friend)", initials: "S", canView: true },
    { id: 3, name: "Emergency Contact", initials: "EC", canView: false },
  ]);

  const journeys: Journey[] = [
    {
      id: 1,
      destination: "Home",
      startTime: "6:30 PM",
      status: "active",
      duration: "15 min",
    },
    {
      id: 2,
      destination: "Office",
      startTime: "Today, 8:00 AM",
      status: "completed",
      duration: "25 min",
    },
    {
      id: 3,
      destination: "Coffee Shop",
      startTime: "Yesterday, 3:15 PM",
      status: "completed",
      duration: "10 min",
    },
  ];

  const toggleContactVisibility = (id: number) => {
    setContacts(contacts.map(contact =>
      contact.id === id ? { ...contact, canView: !contact.canView } : contact
    ));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Location Tracking</h1>
          <p className="text-muted-foreground">Share your journey with trusted contacts</p>
        </div>

        {/* Current Journey */}
        <Card className={isTracking ? "border-primary/50" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${isTracking ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Navigation className={`h-6 w-6 ${isTracking ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <CardTitle>
                    {isTracking ? "Journey in Progress" : "Start Tracking"}
                  </CardTitle>
                  <CardDescription>
                    {isTracking ? "Your location is being shared" : "Begin a new journey"}
                  </CardDescription>
                </div>
              </div>
              {isTracking && (
                <Badge variant="default" className="animate-pulse">Live</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTracking ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="current-destination">Current Destination</Label>
                  <Input
                    id="current-destination"
                    placeholder="e.g., Home, Office, Friend's place"
                    defaultValue="Home"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Started at 6:30 PM</p>
                      <p className="text-sm text-muted-foreground">15 minutes ago</p>
                    </div>
                  </div>
                  <MapPin className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsTracking(false)}
                >
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
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => setIsTracking(true)}
                >
                  <Play className="h-4 w-4 mr-2" />
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
              <Switch
                checked={locationSharing}
                onCheckedChange={setLocationSharing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Check-in Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded to confirm safe arrival
                </p>
              </div>
              <Switch
                checked={autoCheckIn}
                onCheckedChange={setAutoCheckIn}
              />
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
              <Dialog>
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
                      <Input id="contact-name" placeholder="Enter contact name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone">Phone Number</Label>
                      <Input id="contact-phone" placeholder="+1 (555) 000-0000" type="tel" />
                    </div>
                    <Button className="w-full">Add Contact</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
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
                    >
                      {contact.canView ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Journey History */}
        <Card>
          <CardHeader>
            <CardTitle>Journey History</CardTitle>
            <CardDescription>Your recent tracked journeys</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {journeys.map((journey) => (
                <div
                  key={journey.id}
                  className="flex items-center gap-4 p-4 rounded-lg border"
                >
                  <div className={`p-2 rounded-full ${
                    journey.status === 'active' ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    {journey.status === 'active' ? (
                      <AlertCircle className="h-5 w-5 text-primary" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{journey.destination}</p>
                      {journey.status === 'active' && (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {journey.startTime}
                      </span>
                      <span>{journey.duration}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomTabBar />
    </div>
  );
}
