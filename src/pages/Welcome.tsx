import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Heart, BookOpen, Users, AlertCircle, Map } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const features = [
  {
    icon: Heart,
    title: "Mental Health Support",
    description: "24/7 AI counseling and emotional support whenever you need it",
  },
  {
    icon: BookOpen,
    title: "Safety Education",
    description: "Interactive learning modules to build confidence and awareness",
  },
  {
    icon: Shield,
    title: "AI Safety Monitoring",
    description: "Real-time protection from harassment and harmful content",
  },
  {
    icon: AlertCircle,
    title: "Emergency Response",
    description: "Quick access to emergency services and support networks",
  },
  {
    icon: Map,
    title: "Location Tracking",
    description: "Share your journey with trusted contacts for added safety",
  },
  {
    icon: Users,
    title: "Community Support",
    description: "Connect with others in a safe, moderated environment",
  },
];

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container px-4 py-8 max-w-md mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8 pt-8">
          <div className="mb-6">
            <Shield className="h-20 w-20 mx-auto text-primary" />
          </div>
          <h1 className="text-4xl font-heading font-bold mb-3 text-foreground">
            SafeHaven
          </h1>
          <p className="text-lg text-muted-foreground">
            Your AI-powered safety companion
          </p>
        </div>

        {/* Feature Carousel */}
        <div className="mb-8">
          <Carousel className="w-full max-w-sm mx-auto">
            <CarouselContent>
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <CarouselItem key={index}>
                    <Card className="p-6 shadow-soft">
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-heading font-semibold text-lg mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* Privacy Assurance */}
        <div className="mb-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-center text-muted-foreground">
            <Shield className="inline h-4 w-4 mr-1" />
            Your privacy and safety are our top priorities. All data is encrypted and secure.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate("/signup")}
          >
            Get Started
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            onClick={() => navigate("/signin")}
          >
            Sign In
          </Button>
        </div>

        {/* Language Selection - Placeholder for future implementation */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">English (US)</p>
        </div>
      </div>
    </div>
  );
}
