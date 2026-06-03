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
  Star,
  Clock,
  Flame,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { INDIA_EMERGENCY, dialNumber } from "@/lib/india-emergency";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyPlaces, type NearbyPlace } from "@/hooks/useNearbyPlaces";
import { cn } from "@/lib/utils";

export default function Emergency() {
  const [searchQuery, setSearchQuery] = useState("");
  const { location, error: geoError, isLoading: geoLoading, getCurrentLocation } = useGeolocation();
  const { places, loading: placesLoading, error: placesError, fetchNearbyPlaces, getGoogleMapsNavigationUrl } = useNearbyPlaces();

  // Request geolocation on component mount
  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Fetch nearby places when location is available
  useEffect(() => {
    if (location) {
      fetchNearbyPlaces(location, 10000); // 10km radius
    }
  }, [location, fetchNearbyPlaces]);

  const emergencyNumbers = [
    { name: "National Emergency", number: INDIA_EMERGENCY.NATIONAL, icon: Phone, color: "text-emergency" },
    { name: "Police", number: INDIA_EMERGENCY.POLICE, icon: PoliceIcon, color: "text-primary" },
    { name: "Ambulance", number: INDIA_EMERGENCY.AMBULANCE, icon: Hospital, color: "text-accent" },
    { name: "Fire", number: INDIA_EMERGENCY.FIRE, icon: Flame, color: "text-emergency" },
    { name: "Women Helpline", number: INDIA_EMERGENCY.WOMEN_HELPLINE, icon: Heart, color: "text-secondary" },
    { name: "Child Helpline", number: INDIA_EMERGENCY.CHILD_HELPLINE, icon: Heart, color: "text-secondary" },
  ];

  const services = places;

  const getServiceIcon = (type: 'hospital' | 'police' | 'shelter') => {
    switch (type) {
      case "police": return PoliceIcon;
      case "hospital": return Hospital;
      case "shelter": return Heart;
      default: return MapPin;
    }
  };

  const getServiceColor = (type: 'hospital' | 'police' | 'shelter') => {
    switch (type) {
      case "police": return "text-primary";
      case "hospital": return "text-accent";
      case "shelter": return "text-secondary";
      default: return "text-foreground";
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Emergency Services</h1>
          <p className="text-muted-foreground">Quick access to help when you need it</p>
        </div>

        {/* Quick Dial Emergency Numbers — India */}
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
              {emergencyNumbers.map((service) => {
                const Icon = service.icon;
                return (
                  <Button
                    key={service.name}
                    variant="outline"
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => dialNumber(service.number)}
                    aria-label={`Call ${service.name} at ${service.number}`}
                  >
                    <Icon className={`h-6 w-6 ${service.color}`} />
                    <div className="text-center">
                      <p className="font-semibold text-sm">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.number}</p>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="space-y-3">
          {/* Location Status */}
          {geoError || placesError ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-6 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-destructive mb-1">Location Error</h3>
                  <p className="text-sm text-destructive/90">
                    {geoError || placesError}
                  </p>
                  {geoError && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={getCurrentLocation}
                    >
                      Retry Location
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Location Loading State */}
          {geoLoading || (placesLoading && !services.length) ? (
            <Card>
              <CardContent className="py-10 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">
                  {geoLoading ? "Getting your location..." : "Finding nearby services..."}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* Nearby Services Info */}
          {location && !geoLoading && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Location active</p>
                  <p className="text-xs text-muted-foreground">
                    {services.length > 0
                      ? `Found ${services.length} nearby services within 10km`
                      : "Nearby services will appear here once loaded"}
                  </p>
                </div>
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
        </div>

        {/* Service Directory */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="police">Police</TabsTrigger>
            <TabsTrigger value="hospital">Medical</TabsTrigger>
            <TabsTrigger value="shelter">Shelters</TabsTrigger>
          </TabsList>

          {["all", "police", "hospital", "shelter"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {filteredServices
                .filter(service => tab === "all" || service.type === tab)
                .length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground space-y-2">
                    {!location ? (
                      <>
                        <MapPin className="h-8 w-8 mx-auto text-muted-foreground/50" />
                        <p className="font-medium text-foreground">
                          Enable location to find nearby services
                        </p>
                        <p>
                          Grant location permission to see police stations, hospitals, and shelters near you.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={getCurrentLocation}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Enable Location
                        </Button>
                      </>
                    ) : placesLoading ? (
                      <>
                        <Loader2 className="h-8 w-8 mx-auto animate-spin" />
                        <p>Loading nearby services...</p>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-8 w-8 mx-auto text-muted-foreground/50" />
                        <p className="font-medium text-foreground">No {tab} services found nearby</p>
                        <p>
                          Try searching in a different area or check back later.
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredServices
                  .filter(service => tab === "all" || service.type === tab)
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
                                  <div className="flex items-center gap-2 mt-1">
                                    {service.rating && (
                                      <div className="flex items-center">
                                        <Star className="h-3 w-3 fill-accent text-accent" />
                                        <span className="text-sm ml-1">{service.rating.toFixed(1)}</span>
                                      </div>
                                    )}
                                    {service.available24x7 && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Clock className="h-3 w-3 mr-1" />
                                        24/7
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                                  <Navigation className="h-3 w-3" />
                                  {service.distance.toFixed(1)} km
                                </Badge>
                              </div>

                              {service.address && (
                                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="line-clamp-1">{service.address}</span>
                                </p>
                              )}

                              <div className="flex gap-2 mt-3">
                                {service.phone && (
                                  <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => dialNumber(service.phone!)}
                                  >
                                    <Phone className="h-4 w-4 mr-2" />
                                    Call
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    window.open(getGoogleMapsNavigationUrl(service), "_blank");
                                  }}
                                >
                                  <Navigation className="h-4 w-4 mr-2" />
                                  Navigate
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
