import { useState } from "react";
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
  Clock
} from "lucide-react";

interface EmergencyService {
  id: number;
  name: string;
  type: "police" | "hospital" | "ngo";
  phone: string;
  address: string;
  distance: string;
  rating: number;
  available24x7: boolean;
}

export default function Emergency() {
  const [searchQuery, setSearchQuery] = useState("");

  const emergencyNumbers = [
    { name: "Emergency Services", number: "911", icon: Phone, color: "text-emergency" },
    { name: "Police", number: "911", icon: PoliceIcon, color: "text-primary" },
    { name: "Ambulance", number: "911", icon: Hospital, color: "text-accent" },
    { name: "Crisis Helpline", number: "988", icon: Heart, color: "text-secondary" },
  ];

  const services: EmergencyService[] = [
    {
      id: 1,
      name: "City Police Station",
      type: "police",
      phone: "(555) 123-4567",
      address: "123 Main Street, Downtown",
      distance: "0.5 mi",
      rating: 4.5,
      available24x7: true,
    },
    {
      id: 2,
      name: "General Hospital",
      type: "hospital",
      phone: "(555) 234-5678",
      address: "456 Health Ave",
      distance: "1.2 mi",
      rating: 4.8,
      available24x7: true,
    },
    {
      id: 3,
      name: "Women's Support Center",
      type: "ngo",
      phone: "(555) 345-6789",
      address: "789 Safe Haven Blvd",
      distance: "2.0 mi",
      rating: 4.9,
      available24x7: false,
    },
    {
      id: 4,
      name: "Community Police Outpost",
      type: "police",
      phone: "(555) 456-7890",
      address: "321 Community Circle",
      distance: "0.8 mi",
      rating: 4.3,
      available24x7: true,
    },
  ];

  const getServiceIcon = (type: string) => {
    switch (type) {
      case "police": return PoliceIcon;
      case "hospital": return Hospital;
      case "ngo": return Heart;
      default: return MapPin;
    }
  };

  const getServiceColor = (type: string) => {
    switch (type) {
      case "police": return "text-primary";
      case "hospital": return "text-accent";
      case "ngo": return "text-secondary";
      default: return "text-foreground";
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Emergency Services</h1>
          <p className="text-muted-foreground">Quick access to help when you need it</p>
        </div>

        {/* Quick Dial Emergency Numbers */}
        <Card className="border-emergency/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-emergency" />
              Emergency Hotlines
            </CardTitle>
            <CardDescription>Tap to call immediately</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {emergencyNumbers.map((service) => {
                const Icon = service.icon;
                return (
                  <Button
                    key={service.name}
                    variant="outline"
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => {
                      // TODO: Implement phone call in Phase 7
                      console.log(`Calling ${service.number}`);
                    }}
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
            <TabsTrigger value="ngo">Support</TabsTrigger>
          </TabsList>

          {["all", "police", "hospital", "ngo"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {filteredServices
                .filter(service => tab === "all" || service.type === tab)
                .map((service) => {
                  const Icon = getServiceIcon(service.type);
                  return (
                    <Card key={service.id} className="hover:border-primary/50 transition-colors">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-full bg-muted`}>
                            <Icon className={`h-6 w-6 ${getServiceColor(service.type)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold">{service.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center">
                                    <Star className="h-3 w-3 fill-accent text-accent" />
                                    <span className="text-sm ml-1">{service.rating}</span>
                                  </div>
                                  {service.available24x7 && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Clock className="h-3 w-3 mr-1" />
                                      24/7
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Navigation className="h-3 w-3" />
                                {service.distance}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {service.address}
                            </p>
                            
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  // TODO: Implement phone call in Phase 7
                                  console.log(`Calling ${service.phone}`);
                                }}
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  // TODO: Implement directions in Phase 7
                                  console.log(`Getting directions to ${service.name}`);
                                }}
                              >
                                <MapPin className="h-4 w-4 mr-2" />
                                Directions
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <BottomTabBar />
    </div>
  );
}
