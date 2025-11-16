import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, BookOpen, Shield, MessageCircle, Sun, MapPin, Calendar, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const navigate = useNavigate();
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <div className="container px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-heading font-bold mb-1">{greeting}, Sarah! 👋</h1>
          <p className="text-muted-foreground">How are you feeling today?</p>
        </div>

        {/* Daily Check-in */}
        <Card className="p-5 gradient-primary">
          <h3 className="font-heading font-semibold text-primary-foreground mb-3">Daily Check-in</h3>
          <p className="text-sm text-primary-foreground/90 mb-4">
            Take a moment to reflect on your emotions
          </p>
          <div className="flex gap-2">
            {["😊", "😐", "😔", "😰", "😢"].map((emoji, i) => (
              <button
                key={i}
                className="flex-1 p-3 rounded-lg bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors text-2xl backdrop-blur"
              >
                {emoji}
              </button>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Card 
            className="p-4 hover:shadow-medium transition-shadow cursor-pointer"
            onClick={() => navigate("/counseling")}
          >
            <Heart className="h-8 w-8 text-secondary mb-2" />
            <h3 className="font-heading font-semibold text-sm mb-1">AI Counselor</h3>
            <p className="text-xs text-muted-foreground">Get support now</p>
          </Card>
          
          <Card 
            className="p-4 hover:shadow-medium transition-shadow cursor-pointer"
            onClick={() => navigate("/learning")}
          >
            <BookOpen className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-heading font-semibold text-sm mb-1">Learn</h3>
            <p className="text-xs text-muted-foreground">Build confidence</p>
          </Card>
          
          <Card 
            className="p-4 hover:shadow-medium transition-shadow cursor-pointer"
            onClick={() => navigate("/safety-monitor")}
          >
            <Shield className="h-8 w-8 text-accent mb-2" />
            <h3 className="font-heading font-semibold text-sm mb-1">Safety Tools</h3>
            <p className="text-xs text-muted-foreground">Stay protected</p>
          </Card>
          
          <Card 
            className="p-4 hover:shadow-medium transition-shadow cursor-pointer"
            onClick={() => navigate("/community")}
          >
            <MessageCircle className="h-8 w-8 text-secondary mb-2" />
            <h3 className="font-heading font-semibold text-sm mb-1">Community</h3>
            <p className="text-xs text-muted-foreground">Connect safely</p>
          </Card>
        </div>

        {/* Weather & Location Safety */}
        <Card className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <Sun className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-heading font-semibold mb-1">Local Safety Info</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MapPin className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
              <p className="text-sm">Sunny, 72°F · Low crime area · Safe to travel</p>
            </div>
          </div>
        </Card>

        {/* Safety Score */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold">Safety Score</h3>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold text-primary">85%</span>
            </div>
          </div>
          <Progress value={85} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">
            Great! Your safety settings are well configured.
          </p>
          <Button variant="link" size="sm" className="px-0 h-auto mt-2">
            View recommendations
          </Button>
        </Card>

        {/* Activity Summary */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold">This Week</h3>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Counseling sessions</span>
              <span className="font-semibold">3</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Learning modules</span>
              <span className="font-semibold">5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Safety checks</span>
              <span className="font-semibold">12</span>
            </div>
          </div>
        </Card>

        {/* Reminders */}
        <Card className="p-5">
          <h3 className="font-heading font-semibold mb-3">Upcoming Reminders</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Heart className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Evening wellness check</p>
                <p className="text-xs text-muted-foreground">Today at 8:00 PM</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Continue "Building Confidence" module</p>
                <p className="text-xs text-muted-foreground">Tomorrow at 2:00 PM</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <BottomTabBar />
    </div>
  );
}
