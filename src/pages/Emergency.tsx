import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone,
  MapPin,
  Hospital,
  Shield as PoliceIcon,
  Heart,
  Search,
  Navigation,
  Clock,
  Flame,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { INDIA_EMERGENCY, dialNumber } from "@/lib/india-emergency";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyPlaces } from "@/hooks/useNearbyPlaces";
import { LiveMap, type MapMarker } from "@/components/LiveMap";

export default function Emergency() {
  const [searchQuery, setSearchQuery] = useState("");
  const { location, error: geoError, isLoading: geoLoading, getCurrentLocation } = useGeolocation();
  const { places, loading: placesLoading, error: placesError, fetchNearbyPlaces, getGoogleMapsNavigationUrl } = useNearbyPlaces();

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  useEffect(() => {
    if (location) {
      fetchNearbyPlaces(location, 10000);
    }
  }, [location, fetchNearbyPlaces]);

  const emergencyNumbers = [
    { name: "National Emergency", number: INDIA_EMERGENCY.NATIONAL, icon: Phone, color: "text-emergency" },
    { name: "Police",             number: INDIA_EMERGENCY.POLICE,    icon: PoliceIcon, color: "text-primary" },
    { name: "Ambulance",          number: INDIA_EMERGENCY.AMBULANCE, icon: Hospital,   color: "text-accent" },
    { name: "Fire",               number: INDIA_EMERGENCY.FIRE,      icon: Flame,      color: "text-emergency" },
    { name: "Women Helpline",     number: INDIA_EMERGENCY.WOMEN_HELPLINE, icon: Heart, color: "text-secondary" },
    { name: "Child Helpline",     number: INDIA_EMERGENCY.CHILD_HELPLINE, icon: Heart, color: "text-secondary" },
  ];

  const getServiceIcon = (type: "hospital" | "police" | "shelter") => {
    switch (type) {
      case "police":   return PoliceIcon;
      case "hospital": return Hospital;
      case "shelter":  return Heart;
      default:         return MapPin;
    }
  };

  const getServiceColor = (type: "hospital" | "police" | "shelter") => {
    switch (type) {
      case "police":   return "text-primary";
      case "hospital": return "text-accent";
      case "shelter":  return "text-secondary";
      default:         return "text-foreground";
    }
  };

  const filteredServices = places.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mapMarkers: MapMarker[] = places.map((p) => ({
    id: p.id,
    lat: p.latitude,
    lng: p.longitude,
    name: p.name,
    type: p.type,
    distance: p.distance,
    phone: p.phone,
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Emergency Services</h1>
          <p className="text-muted-foreground">Quick access to help when you need it</p>
        </div>

        {/* Quick Dial */}
        <Card className="border-emergency/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-emergency" />
              Emergency Hotlines (India)
            </CardTitle>
            <CardDescription>Tap to call immediately</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {emergencyNumbers.map((svc) => {
                const Icon = svc.icon;
                return (
                  <Button
                    key={svc.name}
                    variant="outline"
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => dialNumber(svc.number)}
                    aria-label={`Call ${svc.name} at ${svc.number}`}
                  >
                    <Icon className={`h-6 w-6 ${svc.color}`} />
                    <div className="text-center">
                      <p className="font-semibold text-sm">{svc.name}</p>
                      <p className="text-xs text-muted-foreground">{svc.number}</p>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Live Map */}
        {location ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                Your Location &amp; Nearby Services
              </CardTitle>
              <CardDescription>
                Blue dot = you ·{" "}
                <span className="text-red-500 font-semibold">H</span> hospital ·{" "}
                <span className="text-indigo-500 font-semibold">P</span> police ·{" "}
                <span className="text-pink-500 font-semibold">S</span> shelter
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden rounded-b-lg">
              <LiveMap
                center={{ lat: location.latitude, lng: location.longitude }}
                markers={mapMarkers}
                height="360px"
                zoom={14}
              />
            </CardContent>
          </Card>
        ) : geoLoading ? (
          <Card>
            <CardContent className="py-10 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Getting your location…</p>
            </CardContent>
          </Card>
        ) : null}

        {/* Errors */}
        {(geoError || placesError) && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-destructive mb-1">Location Error</h3>
                <p className="text-sm text-destructive/90">{geoError || placesError}</p>
                {geoError && (
                  <Button size="sm" variant="outline" className="mt-3" onClick={getCurrentLocation}>
                    Retry Location
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Location info bar */}
        {location && !geoLoading && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {places.length > 0
                    ? `Found ${places.length} nearby services within 10 km`
                    : placesLoading
                    ? "Searching for nearby services…"
                    : "No services found in 10 km radius"}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                  {location.accuracy ? ` · ±${Math.round(location.accuracy)} m` : ""}
                </p>
              </div>
              {placesLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Service Directory */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="police">Police</TabsTrigger>
            <TabsTrigger value="hospital">Medical</TabsTrigger>
            <TabsTrigger value="shelter">Shelters</TabsTrigger>
          </TabsList>

          {(["all", "police", "hospital", "shelter"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {filteredServices.filter((s) => tab === "all" || s.type === tab).length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground space-y-2">
                    {!location ? (
                      <>
                        <MapPin className="h-8 w-8 mx-auto text-muted-foreground/50" />
                        <p className="font-medium text-foreground">Enable location to find nearby services</p>
                        <Button size="sm" variant="outline" className="mt-3" onClick={getCurrentLocation}>
                          <MapPin className="h-4 w-4 mr-2" />Enable Location
                        </Button>
                      </>
                    ) : placesLoading ? (
                      <>
                        <Loader2 className="h-8 w-8 mx-auto animate-spin" />
                        <p>Loading nearby services…</p>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-8 w-8 mx-auto text-muted-foreground/50" />
                        <p className="font-medium text-foreground">
                          No {tab === "all" ? "" : tab} services found nearby
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredServices
                  .filter((s) => tab === "all" || s.type === tab)
                  .map((service) => {
                    const Icon = getServiceIcon(service.type);
                    return (
                      <Card key={service.id} className="hover:border-primary/50 transition-colors">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-full bg-muted">
                              <Icon className={`h-6 w-6 ${getServiceColor(service.type)}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold">{service.name}</h3>
                                  {service.available24x7 && (
                                    <Badge variant="secondary" className="text-xs mt-1">
                                      <Clock className="h-3 w-3 mr-1" />24/7
                                    </Badge>
                                  )}
                                </div>
                                <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                                  <Navigation className="h-3 w-3" />
                                  {service.distance.toFixed(1)} km
                                </Badge>
                              </div>
                              <div className="flex gap-2 mt-3">
                                {service.phone && (
                                  <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => dialNumber(service.phone!)}
                                  >
                                    <Phone className="h-4 w-4 mr-2" />Call
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => window.open(getGoogleMapsNavigationUrl(service), "_blank")}
                                >
                                  <Navigation className="h-4 w-4 mr-2" />Navigate
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <BottomTabBar />
    </div>
  );
}
